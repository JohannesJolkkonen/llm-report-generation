import utils.retrievers as r
from utils.models import DataRetriever, DocumentSchema, Page, Tag

sales_report_schema = DocumentSchema(
    pages=[
        Page(
            page_number=1,
            tags=[],
        ),
        Page(
            page_number=2,
            tags=[],
        ),
        Page(
            page_number=3,
            tags=[
                # Tag(id="executive_summary", title="Executive Summary", variations=[]),
                Tag(
                    id="sales_revenue_total", title="Sales Revenue Total", variations=[]
                ),
                Tag(id="sales_growth_mom", title="Sales Growth Mom", variations=[]),
                Tag(id="gross_margin_total", title="Gross Margin Total", variations=[]),
                Tag(id="customer_retention", title="Customer Retention", variations=[]),
                Tag(id="new_customers", title="New Customers", variations=[]),
            ],
        ),
        # Page(
        #     page_number=4,
        #     tags=[
        #         Tag(id="fin_perf_bullet_1", title="Fin Perf Bullet 1", variations=[]),
        #         Tag(id="fin_perf_bullet_2", title="Fin Perf Bullet 2", variations=[]),
        #         Tag(id="fin_perf_bullet_3", title="Fin Perf Bullet 3", variations=[]),
        #         Tag(
        #             id="sales_revenue_total", title="Sales Revenue Total", variations=[]
        #         ),
        #         Tag(
        #             id="sales_revenue_prevmo",
        #             title="Sales Revenue Prevmo",
        #             variations=[],
        #         ),
        #         Tag(id="sales_revenue_ly", title="Sales Revenue Ly", variations=[]),
        #         Tag(id="sales_growth_mom", title="Sales Growth Mom", variations=[]),
        #         Tag(
        #             id="sales_growth_mom_prevmo",
        #             title="Sales Growth Mom Prevmo",
        #             variations=[],
        #         ),
        #         Tag(
        #             id="sales_growth_mom_ly", title="Sales Growth Mom Ly", variations=[]
        #         ),
        #     ],
        # ),
        # Page(
        #     page_number=5,
        #     tags=[
        #         Tag(
        #             id="product_sales_bullet_1",
        #             title="Product Sales Bullet 1",
        #             variations=[],
        #         ),
        #         Tag(
        #             id="product_sales_bullet_2",
        #             title="Product Sales Bullet 2",
        #             variations=[],
        #         ),
        #     ],
        # ),
    ],
)

sales_report_retrievers = {
    "executive_summary": (r._get_executive_summary, ()),
    "sales_revenue_total": (
        r._get_sales_revenue,
        (lambda self: self.month, lambda self: self.year),
    ),
    "sales_revenue_prevmo": (
        r._get_sales_revenue,
        (lambda self: self.month - 1, lambda self: self.year),
    ),
    "sales_revenue_ly": (
        r._get_sales_revenue,
        (lambda self: self.month, lambda self: self.year - 1),
    ),
    "sales_growth_mom": (
        r._get_sales_growth_mom,
        (lambda self: self.month, lambda self: self.year),
    ),
    "sales_growth_mom_prevmo": (
        r._get_sales_revenue,
        (lambda self: self.month - 1, lambda self: self.year),
    ),
    "sales_growth_mom_ly": (
        r._get_sales_growth_mom,
        (lambda self: self.month, lambda self: self.year - 1),
    ),
    "gross_margin_total": (
        r._get_gross_margin,
        (lambda self: self.month, lambda self: self.year),
    ),
    "customer_retention": (
        r._get_customer_data,
        (
            lambda self: self.month,
            lambda self: self.year,
            "Customer Retention Rate (%)",
        ),
    ),
    "new_customers": (
        r._get_customer_data,
        (
            lambda self: self.month,
            lambda self: self.year,
            "Customer Acquisition Rate (%)",
        ),
    ),
    "fin_perf_bullet_1": (r._get_fin_perf_bullet, ()),
    "fin_perf_bullet_2": (r._get_fin_perf_bullet, ()),
    "fin_perf_bullet_3": (r._get_fin_perf_bullet, ()),
    "product_sales_bullet_1": (r._get_product_sales_bullet, ()),
    "product_sales_bullet_2": (r._get_product_sales_bullet, ()),
}
