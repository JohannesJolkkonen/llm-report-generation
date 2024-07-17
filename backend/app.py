# from fastapi import FastAPI
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from decouple import config
import utils.openai_utils as oai
from utils.qdrant import qdrant_search
from utils.hubspot_utils import get_company_data
from pydantic import BaseModel
from utils.sales_report import sales_report_schema, sales_report_retrievers
from utils.models import DataRetriever

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RetrievalRequest(BaseModel):
    year: int
    month: int


@app.post("/retrieval")
def extraction(request: RetrievalRequest):
    data_retriever = DataRetriever(
        year=request.year,
        month=request.month,
        retrieval_functions=sales_report_retrievers,
        document_schema=sales_report_schema,
    )
    document_data = data_retriever.get_document_data()
    print(document_data)
    return JSONResponse(content=document_data)
