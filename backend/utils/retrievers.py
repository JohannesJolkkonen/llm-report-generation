import pandas as pd
from utils.openai_utils import (
    get_gpt_extraction,
    get_claude_extraction,
    product_sales_prompt,
    financial_performance_prompt,
    exec_summary_prompt,
    recommendations_prompt,
    recommendation_bullets_prompt,
    get_all_extractions,
)

# --- Utility Functions --- #

def _filter_sales_df(
    df: pd.DataFrame,
    month: int,
    year: int = 2024,
    category: str = "",
    product: str = "",
    metric: str = "",
) -> pd.DataFrame:
    filtered_df = df[(df["Month"] == month) & (df["Year"] == year)]
    if category:
        filtered_df = filtered_df[filtered_df["Category"] == category]
    if product:
        filtered_df = filtered_df[filtered_df["Product Name"] == product]
    if metric:
        filtered_df = filtered_df[filtered_df["Metric"] == metric]
    return filtered_df


def _get_product_sales_table_text(month_num: int, year: int, company: str = "comp1") -> str:
    df = pd.read_csv(f"data/{company}_sales_data.csv")
    df = _filter_sales_df(df, month_num, year)
    return df.to_csv(index=False)


def _get_product_sales_table(month_num: int, year: int, company: str = "comp1") -> dict:
    df = pd.read_csv(f"data/{company}_sales_data.csv")
    df = _filter_sales_df(df, month_num, year)
    product_measures = []
    print(df.head(4))
    for _, row in df.iterrows():
        product_dict = {
            "product_name": row["Product Name"],
            "sales_qty": row["Sales Quantity"],
            "sales_change_mom_qty": _get_sales_growth_mom(month_num, year, company=company, product=row["Product Name"]),
            "sales_revenue": row["Sales Revenue ($)"],
            "sales_change_mom_revenue": _get_sales_growth_mom(month_num, year, company=company, product=row["Product Name"])
        }
        product_measures.append(product_dict)

    return product_measures

# --------------------------------------------------------------------------------
# Sales, Revenue, Margin
# --------------------------------------------------------------------------------

def _get_sales_revenue(
    month_num: int,
    year: int,
    company: str = "comp1",
    category: str = "",
    product: str = "",
) -> float:
    df = pd.read_csv(f"data/{company}_sales_data.csv")
    filtered_df = _filter_sales_df(df, month_num, year, category, product)
    revenue = filtered_df["Sales Revenue ($)"].sum()
    return revenue


def _get_gross_margin(
    month_num: int,
    year: int,
    company: str = "comp1",
    category: str = "",
    product: str = "",
) -> float:
    df = pd.read_csv(f"data/{company}_sales_data.csv")
    filtered_df = _filter_sales_df(df, month_num, year, category, product)
    margin = (
        filtered_df["Margin ($)"].sum() / filtered_df["Sales Revenue ($)"].sum()
    ) * 100
    return round(margin)

def _get_sales_growth_mom(
    month_num: int,
    year: int,
    company: str = "comp1",
    category: str = "",
    product: str = "",
) -> float:
    current_month_sales = _get_sales_revenue(month_num, year, company, category, product)
    
    # Calculate previous month and year
    prev_month = month_num - 1
    prev_year = year
    if prev_month == 0:
        prev_month = 12
        prev_year -= 1
    
    previous_month_sales = _get_sales_revenue(prev_month, prev_year, company, category, product)
    
    if previous_month_sales == 0:
        return 0  # Avoid division by zero
    
    growth_rate = ((current_month_sales - previous_month_sales) / previous_month_sales) * 100
    return round(growth_rate)

def _get_sales_growth_yoy(
    month_num: int,
    year: int,
    company: str = "comp1",
    category: str = "",
    product: str = "",
) -> float:
    current_year_sales = _get_sales_revenue(month_num, year, company, category, product)
    
    # Calculate sales for the same month in the previous year
    previous_year_sales = _get_sales_revenue(month_num, year - 1, company, category, product)
    
    if previous_year_sales == 0:
        return 0  # Avoid division by zero
    
    growth_rate = ((current_year_sales - previous_year_sales) / previous_year_sales) * 100
    return round(growth_rate)


def _get_customer_data(
    month_num: int, year: int, metric: str = "", company: str = "comp1"
) -> str:
    df = pd.read_csv(f"data/{company}_customer_metrics.csv")
    filtered_df = _filter_sales_df(df, month_num, year, metric=metric)

    if filtered_df.empty:
        return "No data available"
    else:
        value = filtered_df["Value"].iloc[0]
        return value

def _get_campaign_data(month_num: int, company: str = "comp1") -> str:
    df = pd.read_csv(f"data/{company}_campaigns.csv")
    filtered_df = _filter_sales_df(df, month=month_num)
    prefix = "Our sales campaigns this month:\n"
    return prefix + filtered_df.to_csv(index=False)


def _get_financial_metrics_text(
    month_num: int, year: int, company: str = "comp1"
) -> str:

    def format_value(value):
        if isinstance(value, float):
            return f"{value:.1f}%"
        return str(value)

    data = [
        ["Metric", "[Month, Year]", "Previous Month", "Same Month\n(Last Year)"],
        [
            "Total Sales\nRevenue ($)",
            format_value(_get_sales_revenue(month_num, year, company=company)),
            format_value(_get_sales_revenue(month_num - 1, year, company=company)),
            format_value(_get_sales_revenue(month_num, year - 1, company=company)),
        ],
        [
            "Sales Growth\nRate (MoM) (%)",
            format_value(_get_sales_growth_mom(month_num, year, company=company)),
            format_value(_get_sales_growth_mom(month_num - 1, year, company=company)),
            format_value(_get_sales_growth_mom(month_num, year - 1, company=company)),
        ],
        [
            "Sales Growth\nRate (YoY) (%)",
            format_value(_get_sales_growth_yoy(month_num, year, company=company)),
            format_value(_get_sales_growth_yoy(month_num - 1, year, company=company)),
            format_value(_get_sales_growth_yoy(month_num, year - 1, company=company)),
        ],
        [
            "Gross Margin (%)",
            format_value(_get_gross_margin(month_num, year, company=company)),
            format_value(_get_gross_margin(month_num - 1, year, company=company)),
            format_value(_get_gross_margin(month_num, year - 1, company=company)),
        ],
    ]

    csv_output = "\n".join([",".join(row) for row in data])
    return csv_output



async def _get_executive_summary(month_num: int, year: int, department: str, company: str = "comp1") -> str:
    data = _get_financial_metrics_text(month_num, year, company=company)
    context = f"""
    This pertains to the {department} -department. 
    {_get_campaign_data(month_num, company=company)}
    Financial metrics:
    {data}
    """
    # response = get_gpt_extraction(exec_summary_prompt, context)
    response = await get_all_extractions(exec_summary_prompt, context)
    return [r.strip() for r in response]


async def _get_fin_perf_bullets(month_num: int, year: int, company: str = "comp1") -> str:
    data = _get_financial_metrics_text(month_num, year, company=company)
    response = await get_all_extractions(
        financial_performance_prompt, data
    )
    bullets = [[bullet.strip() for bullet in r.split("|")] for r in response]
    return bullets

# --------------------------------------------------------------------------------
# Product Sales
# --------------------------------------------------------------------------------

async def _get_product_sales_bullets(
    month_num: int, year: int, company: str = "comp1"
) -> str:
    data = _get_product_sales_table_text(month_num, year, company=company)
    campaign_context = _get_campaign_data(month_num, company=company)
    response = await get_all_extractions(product_sales_prompt, data + campaign_context)
    return [[bullet.strip() for bullet in r.split("|")] for r in response]


def _get_category_sales_chart(
    month_num: int, year: int, company: str = "comp1"
) -> dict:
    # Get unique categories
    df = pd.read_csv(f"data/{company}_sales_data.csv")
    categories = df["Category"].unique().tolist()

    # Get sales data for current month, last month, and same month last year
    current_sales = [
        int(_get_sales_revenue(month_num, year, company=company, category=category)) for category in categories
    ]
    last_month_sales = [
        int(_get_sales_revenue(month_num - 1, year, company=company, category=category))
        for category in categories
    ]
    last_year_sales = [
        int(_get_sales_revenue(month_num, year - 1, company=company, category=category))
        for category in categories
    ]

    data = {
        "categories": categories,
        "series": [
            {"title": "Sales", "data": current_sales},
            {"title": "Sales Last Month", "data": last_month_sales},
            {"title": "Same Month LY", "data": last_year_sales},
        ],
    }
    return data


# --------------------------------------------------------------------------------
# Recommendations
# --------------------------------------------------------------------------------

async def _get_recommendations_intro(
    month_num: int, year: int, department: str, company: str = "comp1"
) -> str:
    data = _get_product_sales_table_text(month_num, year, company=company)
    campaign_context = _get_campaign_data(month_num, company=company)
    context = f"""
    This pertains to the {department} -department. 
    {campaign_context}
    
    Financial metrics:
    {data}
    """
    response = await get_all_extractions(
        recommendations_prompt, context
    )
    return [r.strip() for r in response]


async def _get_recommendation_bullets(
    month_num: int, year: int, company: str = "comp1"
) -> list[str]:
    data = _get_product_sales_table_text(month_num, year, company=company)
    campaign_context = _get_campaign_data(month_num, company=company)
    response = await get_all_extractions(
        recommendation_bullets_prompt, campaign_context + data
    )
    return [[bullet.strip() for bullet in r.split("|")] for r in response]


def _get_recommendation_bullet_titles(bullets: list[str]) -> list[str]:
    return [bullet.split("\n")[0].strip().replace("### ", "") for bullet in bullets]


def _get_recommendation_bullet_contents(bullets: list[str]) -> list[str]:
    return ["\n".join(bullet.split("\n")[1:]).strip() for bullet in bullets]
