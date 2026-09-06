"""Library API v1 routes for Campus NEXUS."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from app.api.deps import get_current_db, get_current_active_user, require_admin
from app.models import User, LibraryBook, LibraryBookCopy, LibraryReservation, LibrarySeat, Notification
from app.services.notification_service import notify_student_book_reserved, notify_student_reservation_status_change

router = APIRouter()


class BookOut(BaseModel):
    id: str
    title: str
    author: str
    isbn: Optional[str] = None
    subject: Optional[str] = None
    department: Optional[str] = None
    shelf_location: Optional[str] = None
    total_copies: int
    available_copies: int

    class Config:
        from_attributes = True


class ReserveRequest(BaseModel):
    book_id: str


class ReservationUpdateRequest(BaseModel):
    status: Optional[str] = None


class ReservationOut(BaseModel):
    id: str
    book_id: str
    student_id: str
    reserved_at: datetime
    status: str
    pickup_deadline: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/books", response_model=List[BookOut], tags=["library"])
async def list_books(
    q: Optional[str] = Query(None, description="Search query by title, author, subject, or ISBN"),
    department: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_current_db),
):
    """Search or list library books."""
    stmt = select(LibraryBook)
    if q:
        search_pattern = f"%{q}%"
        stmt = stmt.where(
            (LibraryBook.title.ilike(search_pattern)) |
            (LibraryBook.author.ilike(search_pattern)) |
            (LibraryBook.subject.ilike(search_pattern)) |
            (LibraryBook.isbn.ilike(search_pattern))
        )
    if department:
        stmt = stmt.where(LibraryBook.department.ilike(f"%{department}%"))

    result = await db.execute(stmt)
    books = result.scalars().all()
    return books


@router.get("/books/{book_id}", response_model=BookOut, tags=["library"])
async def get_book_details(
    book_id: str,
    db: AsyncSession = Depends(get_current_db),
):
    """Get details of a specific book."""
    result = await db.execute(select(LibraryBook).where(LibraryBook.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book


@router.post("/reserve", response_model=ReservationOut, tags=["library"])
async def reserve_book(
    payload: ReserveRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_current_db),
):
    """Reserve an available library book."""
    result = await db.execute(select(LibraryBook).where(LibraryBook.id == payload.book_id))
    book = result.scalar_one_or_none()

    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    if book.available_copies <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No available copies to reserve at this moment")

    # Decrement available copy
    book.available_copies -= 1

    deadline = datetime.utcnow() + timedelta(days=2)
    reservation = LibraryReservation(
        id=f"res_{uuid.uuid4().hex[:8]}",
        book_id=book.id,
        student_id=current_user.id,
        status="ready_for_pickup",
        pickup_deadline=deadline,
    )
    db.add(reservation)

    # Create notification for student via shared service
    try:
        await notify_student_book_reserved(
            db,
            student_user_id=current_user.id,
            book_title=book.title,
            book_id=str(book.id),
            pickup_deadline=deadline.strftime("%b %d"),
        )
    except Exception:
        # Fallback: inline creation if service helper fails for any reason
        import uuid as _uuid
        notif = Notification(
            id=f"notif_res_{_uuid.uuid4().hex[:8]}",
            recipient_id=current_user.id,
            event="book_reserved",
            reason=f"Your reservation for '{book.title}' is confirmed. Pick up at shelf {book.shelf_location or 'Main Desk'} by {deadline.strftime('%b %d')}.",
            priority="medium",
            read=False,
        )
        db.add(notif)

    await db.commit()
    await db.refresh(reservation)

    return ReservationOut(
        id=reservation.id,
        book_id=reservation.book_id,
        student_id=str(reservation.student_id),
        reserved_at=reservation.reserved_at,
        status=reservation.status,
        pickup_deadline=reservation.pickup_deadline,
    )


@router.get("/seats", tags=["library"])
async def get_library_seats(db: AsyncSession = Depends(get_current_db)):
    """Get all library seat statuses by zone."""
    result = await db.execute(select(LibrarySeat))
    seats = result.scalars().all()
    
    zones_summary = {}
    for s in seats:
        if s.zone not in zones_summary:
            zones_summary[s.zone] = {"zone": s.zone, "total": 0, "occupied": 0}
        zones_summary[s.zone]["total"] += 1
        if s.is_occupied:
            zones_summary[s.zone]["occupied"] += 1

    return list(zones_summary.values())


@router.get("/occupancy", tags=["library"])
async def get_library_occupancy(db: AsyncSession = Depends(get_current_db)):
    """Get real-time library occupancy metric."""
    total_res = await db.execute(select(func.count(LibrarySeat.id)))
    occupied_res = await db.execute(select(func.count(LibrarySeat.id)).where(LibrarySeat.is_occupied == True))
    
    total = total_res.scalar() or 36
    occupied = occupied_res.scalar() or 12
    return {
        "building": "Central Library",
        "capacity": 120,
        "current_occupancy": occupied,
        "occupancy_rate": round(occupied / max(total, 1), 2),
        "status": "moderate" if occupied / max(total, 1) < 0.7 else "high",
    }


@router.get("/reservations", response_model=List[ReservationOut], tags=["library"])
async def list_reservations(
    db: AsyncSession = Depends(get_current_db),
    _: User = Depends(require_admin),
):
    """List all library reservations (admin only)."""
    result = await db.execute(select(LibraryReservation).order_by(LibraryReservation.reserved_at.desc()))
    reservations = result.scalars().all()
    return [
        ReservationOut(
            id=r.id,
            book_id=r.book_id,
            student_id=str(r.student_id),
            reserved_at=r.reserved_at,
            status=r.status,
            pickup_deadline=r.pickup_deadline,
        )
        for r in reservations
    ]


@router.patch("/reservations/{reservation_id}", response_model=ReservationOut, tags=["library"])
async def update_reservation_status(
    reservation_id: str,
    payload: ReservationUpdateRequest,
    db: AsyncSession = Depends(get_current_db),
    _: User = Depends(require_admin),
):
    """Update a library reservation status (admin only)."""
    result = await db.execute(select(LibraryReservation).where(LibraryReservation.id == reservation_id))
    reservation = result.scalar_one_or_none()
    if not reservation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")

    if payload.status is not None:
        old_status = reservation.status
        reservation.status = payload.status
        await db.commit()
        await db.refresh(reservation)

        try:
            await notify_student_reservation_status_change(
                db,
                student_user_id=reservation.student_id,
                book_id=reservation.book_id,
                reservation_id=reservation.id,
                new_status=payload.status,
            )
        except Exception:
            pass

        return ReservationOut(
            id=reservation.id,
            book_id=reservation.book_id,
            student_id=str(reservation.student_id),
            reserved_at=reservation.reserved_at,
            status=reservation.status,
            pickup_deadline=reservation.pickup_deadline,
        )

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No status provided")
