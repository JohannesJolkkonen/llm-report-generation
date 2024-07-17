from openai import OpenAI
import instructor
from decouple import config
from string import Template
from pydantic import BaseModel, Field
from typing import List, Optional

client = instructor.patch(OpenAI(api_key=config("OPENAI_API_KEY")))

exec_summary_prompt = Template(
    """
You are an expert sales analyst. 
From the given sales data and market information, generate an executive summary for a sales report.
1. The executive summary should be clear, concise, and not longer than the example given below.
2. You will also include the company's name and the reporting period. 
3. You should aim to be as specific as possible, demonstrating your deep experience in sales.

### Example
In the month of January, 2024, CartIt achieved
significant milestones in terms of sales
performance. Total sales revenue showed
robust growth, increasing by 12% compared to
the previous month. Our dedicated sales team
exceeded their targets, contributing to this
success. However, the average transaction
value experienced a slight dip. 
                               
Remember to think carefully, step by step when carrying out this task. 
"""
)

project_steps_prompt = Template(
    """
You are an IT-project expert. From the given transcript and emails, extract the steps for the project that is discussed.
The title should be concise, no more than 3-5 words.
The description should be concise but detailed.
The start_week and end_week should be the start and end week of the step. Here's an example, for a project that starts with a prototyping phase of 2 weeks, followed by an iterative development phase of 4 weeks:
The total_hours should be the total work hours estimated for the step; if we estimate ~10 hours per week, a 3 week step should have total_hours 30.
If available in the data, the hourly_rate should be the hourly rate discussed in the data, otherwise -1 if not available.

### Example
[
    {
        "title": "Prototyping",
        "start_week": 1,
        "end_week": 2,
        "total_hours": 40
    },
    {
        "title": "Iterative Development",
        "start_week": 3,
        "end_week": 6
        "total_hours": 90
    }
]

### Content
$transcripts
                                    
$emails
"""
)

retrieval_query_prompt = Template(
    """
You are an IT-project expert. From the given content describing a software project, extract 3 search keywords, as a comma-separated list.
Two of these keywords should describe the client's industry, and one of them should describe the solution itself.
Keep in mind that the keywords will be used for running a database search to find similar projects.

### Materials
$transcripts

$emails

### Example
e-commerce, retail, predictive analytics
"""
)


class ExecutiveSummary(BaseModel):
    company: str = Field(..., description="The company that the project is for")
    project_tagline: str = Field(..., description="The name of the project")
    problem_statement: str = Field(
        ..., description="The problem statement of the project in rich HTML"
    )
    proposed_solution: str = Field(
        ..., description="The proposed solution of the project in rich HTML"
    )


class ProjectStep(BaseModel):
    title: str = Field(..., description="The title of the stage")
    description: str = Field(..., description="The description of the stage")
    start_week: int = Field(..., description="The start week of the stage")
    end_week: int = Field(..., description="The end week of the step")
    total_hours: Optional[int] = Field(
        ..., description="The total work hours estimated for the step"
    )


class ProjectSteps(BaseModel):
    project_steps: List[ProjectStep]
    week_count: int = Field(..., description="The total number of weeks in the project")
    hourly_rate: Optional[int] = Field(
        ...,
        description="The hourly rate for the step, or a general rate if not step-specific.",
    )


class SearchKeywords(BaseModel):
    keywords: List[str]


retrieval_query_prompt = Template(
    """
From the given content describing a software project, extract 3 search keywords, as a comma-separated list.
If the content discusses Efficient Operations, you will return 
document creation, AI Automation

If the content discusses Nexus Retail, you will return 
retail, e-commerce, data platform

### Materials
$transcripts

$emails

"""
)

extractions = {
    "executive_summary": {
        "prompt": exec_summary_prompt,
        "response_model": ExecutiveSummary,
    },
    "project_steps": {"prompt": project_steps_prompt, "response_model": ProjectSteps},
    "search_keywords": {
        "prompt": retrieval_query_prompt,
        "response_model": SearchKeywords,
    },
}


def get_gpt_extraction(hubspot_data: dict, extraction: str):
    prompt_template = extractions[extraction]["prompt"]
    prompt = prompt_template.safe_substitute(
        transcripts=hubspot_data["calls"], emails=hubspot_data["emails"]
    )
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "user", "content": prompt},
        ],
        response_model=extractions[extraction]["response_model"],
    )
    if isinstance(response, ProjectSteps):
        response.hourly_rate = hubspot_data["hourly_rate"]

    return response


def get_embeddings(text: str):
    return (
        client.embeddings.create(input=text, model="text-embedding-ada-002")
        .data[0]
        .embedding
    )


def get_retrieval_query(hubspot_data: dict):
    prompt = retrieval_query_prompt.safe_substitute(
        transcripts=hubspot_data["calls"], emails=hubspot_data["emails"]
    )
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "user", "content": prompt},
        ],
    )
    return response
