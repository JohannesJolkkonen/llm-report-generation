from shiny import ui, render, reactive

from shiny import App, ui, render, reactive
from pathlib import Path
import base64

app_ui = ui.page_fluid(
    ui.h1("PDF Preview with Alternatives"),
    ui.div(
        ui.input_action_button("prev_page", "Previous Page"),
        ui.input_action_button("next_page", "Next Page"),
        ui.output_text("page_info"),
        class_="d-flex justify-content-between align-items-center mb-3",
    ),
    ui.div(ui.output_ui("alternative_buttons"), class_="mb-3"),
    ui.output_ui("pdf_preview"),
)


def server(input, output, session):
    current_page = reactive.Value(1)
    total_pages = reactive.Value(0)
    current_alternative = reactive.Value(0)

    @reactive.Effect
    @reactive.event(input.prev_page)
    def go_to_prev_page():
        if current_page() > 1:
            current_page.set(current_page() - 1)

    @reactive.Effect
    @reactive.event(input.next_page)
    def go_to_next_page():
        if current_page() < total_pages():
            current_page.set(current_page() + 1)

    @output
    @render.text
    def page_info():
        return f"Page {current_page()} of {total_pages()}"

    @output
    @render.ui
    def alternative_buttons():
        alternatives = [
            "This is the first alternative text. It can be quite long and contain multiple sentences.",
            "Here's the second alternative. It might discuss different aspects of the content on the current page.",
            "The third alternative could provide yet another interpretation or summary of the page content.",
        ]
        return ui.div(
            ui.input_radio_buttons(
                "alternative_choice",
                label="Choose an alternative:",
                choices=dict(enumerate(alternatives)),
                selected=current_alternative(),
            ),
            class_="alternative-buttons",
        )

    @reactive.Effect
    @reactive.event(input.alternative_choice)
    def update_alternative():
        current_alternative.set(int(input.alternative_choice()))

    @output
    @render.ui
    def pdf_preview():
        # Replace this with your actual PDF file path
        pdf_path = f"path/to/your/pdf/file_page_{current_page()}.pdf"

        with open(pdf_path, "rb") as pdf_file:
            encoded_pdf = base64.b64encode(pdf_file.read()).decode("utf-8")

        pdf_data_uri = f"data:application/pdf;base64,{encoded_pdf}"

        return ui.tags.iframe(
            src=pdf_data_uri,
            width="100%",
            height="600px",
            style="border: 1px solid #ddd;",
        )


app = App(app_ui, server)

# Add this to your CSS file or include it in a <style> tag in your HTML
"""
<style>
.alternative-buttons .form-check {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    margin-bottom: 10px;
    cursor: pointer;
}
.alternative-buttons .form-check:hover {
    background-color: #f8f9fa;
}
.alternative-buttons .form-check-input {
    display: none;
}
.alternative-buttons .form-check-label {
    width: 100%;
    cursor: pointer;
}
.pdf-preview {
    border: 1px solid #ddd;
    padding: 20px;
    min-height: 400px;
}
</style>
"""
