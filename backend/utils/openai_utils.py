from openai import OpenAI
import instructor
from decouple import config
from string import Template
from pydantic import BaseModel, Field
from typing import List, Optional
from anthropic import Anthropic
from groq import Groq
import asyncio

oai_client = instructor.patch(OpenAI(api_key=config("OPENAI_API_KEY")))
anthropic_client = Anthropic(api_key=config("ANTHROPIC_API_KEY"))
groq_client = Groq(api_key=config("GROQ_API_KEY"))

product_sales_prompt = """
You are an expert sales analyst. 
From the given sales data and business context, generate a list of 3 bullet points to highlight findings in product and category sales for the current month.
1. The bullets should be clear, concise, and not longer than the examples given below. 
2. You should aim to be as specific as possible, demonstrating your deep experience in sales. 
3. Return the 3 bullets separated by a pipe symbol |.
4. Make sure to keep each bullet no more than 15 words.
5. Don't include anything else than the bullets in your response, without titles or intros.

### Example
Electronics sales increased significantly, contributing 40% to total revenue. |
Fashion and Home & Garden categories also showed strong growth, with 28% and 22% of total sales, respectively. |
Top-selling product, Echo Dot, saw a 15% increase in unit sales, driving overall growth in Electronics.
"""

financial_performance_prompt = """
You are an expert sales analyst. 
From the given sales data and business context, generate a list of 4 bullet points to highlight findings in financial performance for the current month.

1. The bullets should be clear, concise, and not longer than the examples given below. 
2. You should aim to be as specific as possible, demonstrating your deep experience in sales. 
3. Return the 4 bullets separated by a pipe symbol |
4. Make sure to keep each bullet no more than 15 words.
5. Make sure to base all your observations on the sales data, and look to the context to highlight any insights.
6. Don't include anything else than the bullets in your response, without titles or intros.

### Example
Total Sales Revenue increased by 10% compared to the previous month |
Year-over-year sales growth remains strong, with a 15% increase |
Gross Margin improved to 46%, indicating enhanced profitability |
Customer loyalty program boosted repeat purchases by 22%, helping drive revenue upward
"""


exec_summary_prompt = """
You are an expert sales analyst. 
From the given sales data and market information, generate an executive summary for a sales report, made for a particular department of ACME.
1. The executive summary should be concise, in the same style as the given examples.
2. You will also include the company's name and the reporting period. 
3. The summary must be 3 paragraphs, 2 short sentences each.
4. Don't include anything else than the executive summary in your response, without titles or intros.

Examples:
In May 2024, the Media & Electronics department achieved $1,458,000 in sales revenue, up 5% month-over-month and 12% year-over-year. This was driven by a new inventory system cutting carrying costs by 15% and a loyalty program boosting repeat purchases by 22%. Improved supplier terms, optimized digital marketing, and dynamic pricing also enhanced revenue and margins.

Key campaigns, "Mother’s Day Tech Gifts" and "Graduation Gear Up," significantly boosted performance. These strategies and operational efficiencies were crucial for our financial success and are essential for ongoing growth.
- 
In June 2024, the Energy department achieved $2,475,000 in sales revenue, a 10% month-over-month and 9% year-over-year increase. This was driven by a new inventory system reducing carrying costs by 15% and a loyalty program increasing repeat purchases by 22%. Supplier negotiations, digital marketing, and dynamic pricing also boosted revenue and margins.

Key campaigns, "Beat the Heat with Energy Efficiency" and "Energy Independence Day," focused on energy efficiency and renewable adoption, driving financial growth. Maintaining focus on these strategies is vital for our competitive edge in the energy market.
-

5. Think through your response step by step, to ensure it is never any longer than the given examples. Longer responses could cause people to die.
"""

recommendations_prompt = """
You are an expert sales analyst. 
From the given sales data and business context for a company, ACME, generate a conclusion, also serving as an intro for some further recommendations.
1. The conclusion should be concise and brief, only highlighting a few key findings.
2. Split the summary into 3 paragraphs, using newlines. Each paragraph should be no longer than 1-2 sentences.
3. Avoid using adjectives, unless strictly necessary.
4. Importantly, do not include the recommendations themselves. They will be added in a separate step.
5. Think carefully in your response, to ensure your response is not any longer than the given example.
6. Remember to end with a clear introduction to the recommandations, ending with ':'.
7. Don't include anything else than the conclusion in your response, without intros or preludes.

Example:

In this month's report, we have observed several key trends and achievements.

Total sales revenue has increased by 10% compared to the previous month, demonstrating steady growth.

Despite these successes, we have noted a slight decrease in the average transaction value. To maintain our growth trajectory and address challenges effectively, we recommend the following actions:
"""

recommendation_bullets_prompt = """
You are an expert sales analyst. 
From the given sales data and business context, generate a list of 3 recommendations, each with a title and description, and separate them by a pipe symbol |
1. The title should be clear, concise, and not longer than the examples given below, 2-4 words.
2. The description should be clear, concise, and not longer than the examples given below, 10-15 words.
3. Don't include anything else than the bullets in your response, without intros.

### Enhance Average Transaction Value
To counter the dip in average transaction value, explore strategies such as bundling complementary products or introducing upsell and cross-sell opportunities
|
### Customer Segmentation
Consider implementing customer segmentation to tailor marketing efforts more effectively
|
### Continuous Training and Development
Continue investing in the training and development of the sales team to ensure they remain at the forefront of industry knowledge and sales techniques

"""

def get_gpt_extraction(prompt: str, input: str):
    response = oai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": input},
        ],
    )
    return response.choices[0].message.content


def get_embeddings(text: str):
    return (
        oai_client.embeddings.create(input=text, model="text-embedding-ada-002")
        .data[0]
        .embedding
    )


def get_claude_extraction(prompt: str, input: str):
    response = anthropic_client.messages.create(
        model="claude-3-5-sonnet-20240620",
        max_tokens=1000,
        system=prompt,
        messages=[
            {"role": "user", "content": [
                {
                    "type": "text",
                    "text": input,
                }
            ]
            },
        ],
    )
    return response.content[0].text

def get_llama_extraction(prompt: str, input: str):
    response = groq_client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": input},
        ],
    )
    return response.choices[0].message.content

async def get_all_extractions(prompt: str, input: str) -> List[str]:
    async def get_extraction(func, prompt, input):
        return await asyncio.to_thread(func, prompt, input)

    async def get_all_extractions_async(prompt: str, input: str):
        tasks = [
            get_extraction(get_gpt_extraction, prompt, input),
            get_extraction(get_claude_extraction, prompt, input),
            get_extraction(get_llama_extraction, prompt, input),
        ]
        return await asyncio.gather(*tasks)

    return await get_all_extractions_async(prompt, input)
