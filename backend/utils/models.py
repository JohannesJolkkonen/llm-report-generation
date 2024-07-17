import pandas as pd
from pydantic import BaseModel, Field
from typing import List, Optional, Union


class Tag(BaseModel):
    id: str
    title: str
    variations: Union[List[dict], str]


class Page(BaseModel):
    page_number: int = Field(..., alias="pageNumber")
    tags: List[Tag]
    
    class Config:
        populate_by_name = True


class DocumentSchema(BaseModel):
    pages: List[Page]


class DataRetriever(BaseModel):
    year: int
    month: int
    retrieval_functions: dict
    document_schema: DocumentSchema

    def execute_tag(self, tag_id: str):
        print(f"Executing tag: {tag_id}")
        if tag_id in self.retrieval_functions:
            func, args = self.retrieval_functions[tag_id]
            evaluated_args = [arg(self) if callable(arg) else arg for arg in args]
            print(f"Executing function: {func.__name__} with args: {evaluated_args}")
            result = func(*evaluated_args)
            return str(result) if not isinstance(result, list) else result
        else:
            return "Tag executor not found"

    def populate_page_tags(self, page: Page):
        for tag in page.tags:
            variations = self.execute_tag(tag.id)
            if isinstance(variations, list):
                tag.variations = []
                for i, variation in enumerate(variations):
                    tag.variations.append({"id": i, "text": variation})
            else:
                tag.variations = [{"id": 0, "text": variations}]

    def populate_all_tags(self):
        for page in self.document_schema.pages:
            self.populate_page_tags(page)

    def get_document_data(self):
        self.populate_all_tags()
        return self.document_schema.model_dump(by_alias=True)
