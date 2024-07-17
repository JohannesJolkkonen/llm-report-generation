import pandas as pd


def _filter_sales_df(
    df: pd.DataFrame,
    month: str,
    year: int,
    category: str = "",
    product: str = "",
    metric: str = "",
) -> pd.DataFrame:
    filtered_df = df[(df["Month"] == month) & (df["Year"] == year)]
    if category:
        filtered_df = filtered_df[filtered_df["Category"] == category]
    if product:
        filtered_df = filtered_df[filtered_df["Product"] == product]
    if metric:
        filtered_df = filtered_df[filtered_df["Metric"] == metric]
    return filtered_df


def _get_sales_revenue(
    month_num: int, year: int, category: str = "", product: str = ""
) -> float:
    df = pd.read_csv("data/comp1_sales_data.csv")
    filtered_df = _filter_sales_df(df, month_num, year, category, product)
    revenue = filtered_df["Sales Revenue ($)"].sum()
    return revenue


def _get_gross_margin(
    month_num: int, year: int, category: str = "", product: str = ""
) -> float:
    df = pd.read_csv("data/comp1_sales_data.csv")
    filtered_df = _filter_sales_df(df, month_num, year, category, product)
    margin = filtered_df["Margin ($)"].sum()
    return margin


def _get_sales_growth_mom(
    month_num: int, year: int, category: str = "", product: str = ""
) -> float:
    current_revenue = _get_sales_revenue(month_num, year, category, product)
    prev_revenue = _get_sales_revenue(month_num - 1, year, category, product)
    growth_mom = current_revenue - prev_revenue
    return growth_mom


def _get_customer_data(month_num: int, year: int, metric: str = "") -> str:
    df = pd.read_csv("data/comp1_customer_metrics.csv")
    filtered_df = _filter_sales_df(df, month_num, year, metric=metric)
    
    if filtered_df.empty:
        return "No data available"
    else:
        value = filtered_df["Value"].iloc[0]
        return value
    

def _get_executive_summary() -> str:
    return ["Executive summary var 1", "Executive summary var 2"]


def _get_fin_perf_bullet() -> str:
    return ["Financial performance bullet var 1", "Financial performance bullet var 2"]


def _get_product_sales_bullet() -> str:
    return ["Product sales bullet var 1", "Product sales bullet var 2"]
