"""Pydantic schemas for Issue model."""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List, Any


class IssueReportBase(BaseModel):
    location_id: int | str
    category: str
    description: str
    reported_by: Optional[Any] = None
    priority: str = "medium"


class IssueReportCreate(IssueReportBase):
    pass


class IssueReportInDB(IssueReportBase):
    id: str
    status: str = "open"
    timestamp: Optional[datetime] = None
    upvotes: int = 0
    cluster_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class IssueReport(IssueReportInDB):
    pass


class IssueClusterBase(BaseModel):
    canonical_issue_id: str
    cluster_hash: str
    confidence: float
    supporting_reports: int
    status: str


class IssueCluster(IssueClusterBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class IssueBase(BaseModel):
    title: str
    category: str
    location_id: int | str
    description: str
    priority: str


class IssueCreate(IssueBase):
    pass


class Issue(IssueBase):
    id: str
    status: str
    report_count: int
    confidence: float
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
