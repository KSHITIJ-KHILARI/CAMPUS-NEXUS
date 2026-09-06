"""Seed and normalize Somaiya Vidyavihar University campus locations and buildings.

Ensures every location has:
- Correct name, location_type, coordinates, geofence radius, capacity, and operational_status
- Linked building with consistent IDs
- Safe upsert logic so existing records and foreign keys are never broken
"""

import asyncio
import sys
from pathlib import Path
from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import async_session_factory, engine
from app.models.campus_location import CampusLocation, LocationType
from app.models.building import Building
from app.models.floor import Floor
from app.models.room import Room


SOMAIYA_BUILDINGS = [
    {
        "code": "KJSCE-A",
        "name": "Aryabhata Building (KJSCE A-Block)",
        "latitude": 19.0732,
        "longitude": 72.8998,
        "num_floors": 5,
        "is_accessible": True,
    },
    {
        "code": "KJSCE-B",
        "name": "Bhaskaracharya Building (KJSCE B-Block)",
        "latitude": 19.0735,
        "longitude": 72.9002,
        "num_floors": 6,
        "is_accessible": True,
    },
    {
        "code": "SIMSR",
        "name": "Institute of Management (SIMSR)",
        "latitude": 19.0718,
        "longitude": 72.9005,
        "num_floors": 4,
        "is_accessible": True,
    },
    {
        "code": "SVU-LIB",
        "name": "Central Library & Knowledge Center",
        "latitude": 19.0725,
        "longitude": 72.8992,
        "num_floors": 4,
        "is_accessible": True,
    },
    {
        "code": "SVU-SAC",
        "name": "Student Activity Center & Arena",
        "latitude": 19.0738,
        "longitude": 72.9010,
        "num_floors": 3,
        "is_accessible": True,
    },
    {
        "code": "SVU-ADM",
        "name": "Administrative & Examination Block",
        "latitude": 19.0712,
        "longitude": 72.8980,
        "num_floors": 3,
        "is_accessible": True,
    },
    {
        "code": "SVU-AUR",
        "name": "Aurobindo IT & Computing Complex",
        "latitude": 19.0728,
        "longitude": 72.8995,
        "num_floors": 5,
        "is_accessible": True,
    },
]

SOMAIYA_LOCATIONS = [
    {
        "name": "Central Library & Reading Hall",
        "location_type": LocationType.LIBRARY,
        "building_code": "SVU-LIB",
        "latitude": 19.0725,
        "longitude": 72.8992,
        "geofence_radius_meters": 75.0,
        "capacity": 250,
        "operational_status": "operational",
    },
    {
        "name": "Engineering Main Canteen",
        "location_type": LocationType.FOOD_COURT,
        "building_code": "KJSCE-A",
        "latitude": 19.0729,
        "longitude": 72.8988,
        "geofence_radius_meters": 60.0,
        "capacity": 180,
        "operational_status": "operational",
    },
    {
        "name": "Aryabhata Lecture Halls (A-Block)",
        "location_type": LocationType.BUILDING,
        "building_code": "KJSCE-A",
        "latitude": 19.0732,
        "longitude": 72.8998,
        "geofence_radius_meters": 80.0,
        "capacity": 300,
        "operational_status": "operational",
    },
    {
        "name": "Bhaskaracharya Computer Labs (B-Block)",
        "location_type": LocationType.BUILDING,
        "building_code": "KJSCE-B",
        "latitude": 19.0735,
        "longitude": 72.9002,
        "geofence_radius_meters": 80.0,
        "capacity": 220,
        "operational_status": "operational",
    },
    {
        "name": "SIMSR Management Auditorium",
        "location_type": LocationType.BUILDING,
        "building_code": "SIMSR",
        "latitude": 19.0718,
        "longitude": 72.9005,
        "geofence_radius_meters": 90.0,
        "capacity": 400,
        "operational_status": "operational",
    },
    {
        "name": "Somaiya Sports Complex & Athletics Ground",
        "location_type": LocationType.ATHLETICS,
        "building_code": "SVU-SAC",
        "latitude": 19.0738,
        "longitude": 72.9010,
        "geofence_radius_meters": 120.0,
        "capacity": 500,
        "operational_status": "operational",
    },
    {
        "name": "Aurobindo Computing & Innovation Hub",
        "location_type": LocationType.BUILDING,
        "building_code": "SVU-AUR",
        "latitude": 19.0728,
        "longitude": 72.8995,
        "geofence_radius_meters": 70.0,
        "capacity": 150,
        "operational_status": "operational",
    },
    {
        "name": "Vidyavihar University Main Gate & Quadrangle",
        "location_type": LocationType.ENTRANCE,
        "building_code": "SVU-ADM",
        "latitude": 19.0712,
        "longitude": 72.8980,
        "geofence_radius_meters": 100.0,
        "capacity": 350,
        "operational_status": "operational",
    },
]


async def seed_locations_and_buildings():
    print("Seeding Somaiya Vidyavihar campus buildings and canonical locations...")
    async with async_session_factory() as session:
        # 1. Upsert buildings
        building_id_map = {}
        for b_data in SOMAIYA_BUILDINGS:
            res = await session.execute(select(Building).where(Building.code == b_data["code"]))
            b_obj = res.scalar_one_or_none()
            if not b_obj:
                b_obj = Building(
                    code=b_data["code"],
                    name=b_data["name"],
                    latitude=b_data["latitude"],
                    longitude=b_data["longitude"],
                    num_floors=b_data["num_floors"],
                    is_accessible=b_data["is_accessible"],
                )
                session.add(b_obj)
                await session.flush()
                print(f"  + Created Building: {b_obj.name} ({b_obj.code})")
            else:
                b_obj.name = b_data["name"]
                b_obj.latitude = b_data["latitude"]
                b_obj.longitude = b_data["longitude"]
                b_obj.num_floors = b_data["num_floors"]
                b_obj.is_accessible = b_data["is_accessible"]
                print(f"  ~ Updated Building: {b_obj.name} ({b_obj.code})")
            building_id_map[b_data["code"]] = b_obj.id

        # 2. Upsert campus locations
        for loc_data in SOMAIYA_LOCATIONS:
            res = await session.execute(select(CampusLocation).where(CampusLocation.name == loc_data["name"]))
            loc_obj = res.scalar_one_or_none()
            bldg_id = building_id_map.get(loc_data["building_code"])

            if not loc_obj:
                loc_obj = CampusLocation(
                    name=loc_data["name"],
                    location_type=loc_data["location_type"],
                    building_id=bldg_id,
                    latitude=loc_data["latitude"],
                    longitude=loc_data["longitude"],
                    geofence_radius_meters=loc_data["geofence_radius_meters"],
                    capacity=loc_data["capacity"],
                    operational_status=loc_data["operational_status"],
                )
                session.add(loc_obj)
                print(f"  + Created Campus Location: {loc_obj.name}")
            else:
                loc_obj.location_type = loc_data["location_type"]
                loc_obj.building_id = bldg_id
                loc_obj.latitude = loc_data["latitude"]
                loc_obj.longitude = loc_data["longitude"]
                loc_obj.geofence_radius_meters = loc_data["geofence_radius_meters"]
                loc_obj.capacity = loc_data["capacity"]
                loc_obj.operational_status = loc_data["operational_status"]
                print(f"  ~ Updated Campus Location: {loc_obj.name}")

        await session.commit()
        print("Somaiya campus locations & buildings seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_locations_and_buildings())
