import pandas as pd
from pydantic import BaseModel, Field
from typing import List, Optional, Union, Callable, Any
import utils.retrievers as r
import asyncio
import inspect 

class Tag(BaseModel):
    id: str
    title: str
    source: Optional[str] = ""
    variations: Union[List[dict], str]


class Page(BaseModel):
    page_number: int = Field(..., alias="pageNumber")
    tags: List[Tag]

    class Config:
        populate_by_name = True


class DocumentSchema(BaseModel):
    pages: List[Page]


class ProductSales(BaseModel):
    product_name: str
    sales_qty: int
    sales_change_mom_qty: float
    sales_revenue: float
    sales_change_mom_revenue: float


class DataRetriever(BaseModel):
    year: int
    month: int
    company: str
    department: str
    retrieval_functions: dict
    document_schema: DocumentSchema
    lock: asyncio.Lock = Field(default_factory=asyncio.Lock)
    
    class Config:
        arbitrary_types_allowed = True

    async def populate_tag(self, page: Page, tag: Tag):
        async with self.lock:
            if tag.id in self.retrieval_functions:
                func_or_lambda = self.retrieval_functions[tag.id]["retriever"]
                multiple_values = self.retrieval_functions[tag.id]["multiple_values"]
                
                print(f"Executing tag {tag.id} on page {page.page_number}")
                
                async def execute_once():
                    if callable(func_or_lambda):
                        result = func_or_lambda(self)
                        return await result if inspect.iscoroutine(result) else result
                    func, args = func_or_lambda
                    evaluated_args = [arg(self) if callable(arg) else arg for arg in args]
                    if asyncio.iscoroutinefunction(func):
                        result = await func(*evaluated_args)
                    else:
                        result = func(*evaluated_args)
                    return str(result) if not isinstance(result, (list, dict)) else result

                if multiple_values:
                    variations = await execute_once()
                else:
                    variations = [await execute_once()]

                tag.variations = [{"id": i, "text": variation} for i, variation in enumerate(variations)]
            else:
                tag.variations = [{"id": 0, "text": "Tag executor not found"}]


    def get_short_month(self):
        months_map = {
            5: "May",
            6: "June",
        }
        return months_map[self.month]

    async def get_document_data(self):
        async with self.lock:
            return self.document_schema.model_dump(by_alias=True)