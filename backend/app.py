from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
from utils.sales_report import sales_report_schema, sales_report_retrievers
from utils.models import DataRetriever
import asyncio
import json 
from time import sleep

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

company_name_map = {
    "Media & Electronics": "comp1",
    "Energy": "comp2",
}


class RetrievalRequest(BaseModel):
    year: int
    month: int
    company: str


@app.get("/retrieval")
async def extraction(year: int, month: int, department: str):
    async def event_generator():
        data_retriever = DataRetriever(
            year=year,
            month=month,
            company=company_name_map[department],
            department=department,
            retrieval_functions=sales_report_retrievers,
            document_schema=sales_report_schema,
        )
        total_pages = len(data_retriever.document_schema.pages)
        total_tags = sum(len(page.tags) for page in data_retriever.document_schema.pages)
        tags_processed = 0

        yield {
            "event": "init",
            "data": json.dumps({"total_pages": total_pages}),
        }
        
        progress_queue = asyncio.Queue()

        async def process_page(page_index, page):
            nonlocal tags_processed
            for tag_index, tag in enumerate(page.tags):
                await data_retriever.populate_tag(page, tag)
                tags_processed += 1
                progress = {
                    "page": page_index + 1,
                    "total_pages": total_pages,
                    "tag": tag_index + 1,
                    "total_tags": len(page.tags),
                    "tagId": tag.id,
                    "overall_progress": tags_processed / total_tags
                }
                await progress_queue.put(progress)

        tasks = [asyncio.create_task(process_page(i, page)) for i, page in enumerate(data_retriever.document_schema.pages)]
        
        async def progress_reporter():
            while any(task for task in tasks if not task.done()) or not progress_queue.empty():
                progress_event = await progress_queue.get()
                yield {
                    "event": "progress",
                    "data": json.dumps(progress_event),
                }

        async for progress_event in progress_reporter():
            print(f"Yielding progress: {progress_event}")
            yield progress_event

        # Wait for all tasks to complete before yielding 'done'
        await asyncio.gather(*tasks)

        print("Yielding done, with data: ", await data_retriever.get_document_data())
        yield {
            "event": "done",
            "data": json.dumps(await data_retriever.get_document_data()),
        }

    return EventSourceResponse(event_generator())