from __future__ import annotations

from dataclasses import dataclass, field
from uuid import uuid4

from app.config import Settings


@dataclass(frozen=True)
class QueueJob:
    id: str
    queue: str
    task: str
    payload: dict[str, str]


@dataclass
class InMemoryQueueAdapter:
    jobs: list[QueueJob] = field(default_factory=list)

    def enqueue(self, queue: str, task: str, payload: dict[str, str]) -> QueueJob:
        job = QueueJob(id=str(uuid4()), queue=queue, task=task, payload=payload)
        self.jobs.append(job)
        return job


class QueueNames:
    def __init__(self, settings: Settings) -> None:
        self.critical = settings.queue_critical_name
        self.default = settings.queue_default_name
        self.low = settings.queue_low_name


queue_adapter = InMemoryQueueAdapter()
