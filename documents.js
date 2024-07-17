const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const HTMLPptxModule = require("docxtemplater-html-pptx-module");
const ImageModule = require("docxtemplater-image-module");

let placeholders = [
    "client",
    "project_tagline",
    "problem_statement",
    "proposed_solution",
    "project_steps",
    "cases",
    "testimonials",
]

let renders = {};

const content = fs.readFileSync(
    path.resolve(__dirname, 'proposal_template.pptx'),


     'binary'
);

const api = axios.create({
    baseURL: "http://localhost:8000",
});

const zip = new PizZip(content);
const imageOptions = {
    getImage(tagValue) {
        return fs.readFileSync(tagValue, "binary");
    },
    getSize(image, data, tagValue, options) {
        return [250, 250]
        // const part = options.part;
        // if (
        //     part.module ===
        //     "open-xml-templating/docxtemplater-replace-image-module"
        // ) {
        //     return [part.width, part.height];
        // }

        // // return usual value, using image-size or other method.
        // const buffer = Buffer.from(image, "binary");
        // const sizeObj = sizeOf(buffer);
        // return [sizeObj.width, sizeObj.height];
    },
};

const doc = new Docxtemplater(
    zip, {
        paragraphLoop: true,
        lineBreaks: true,
        modules: [new HTMLPptxModule({}), new ImageModule(imageOptions)],
    });


async function extract(tag) {
    const response = await api.post("/extraction", {tag: tag});
    return response.data;
}
 
async function retrieve(query, collection, k) {
    const response = await api.post("/retrieval", {query: query, collection: collection, k: k});
    return response.data;
}

async function extractSearchKeywords() {
    const data = await extract("search_keywords");
    return data.keywords.join(", ");
}

async function extractExecSummary() {
    const data = await extract("executive_summary");
    console.log(data);

    renders.client = data.company;
    renders.project_tagline = data.project_tagline;
    renders.problem_statement = data.problem_statement;
    renders.proposed_solution = data.proposed_solution;
}

async function extractProjectSteps() {
    const data = await extract("project_steps");
    console.log(data);
    project_steps = data.project_steps.map(step => {
        return {
            title: step.title,
            time: "Week " + step.start_week + "-" + step.end_week,
            description: step.description,
            cost: data.hourly_rate > 0 ? `${step.total_hours}h X ${data.hourly_rate}€ = ${step.total_hours * data.hourly_rate}€` : `${step.total_hours}h X  €`
        }
    })
    console.log(project_steps);
    renders.project_steps = project_steps;
    }

async function retrieveProjectCases(query) {
    const data = await retrieve(query=query, collection="project_cases", k=3);
    data.forEach((project_case, index) => {
        const caseKey = "case_" + (index+1);
        renders[caseKey] = `
            <h5>${project_case.title}</h5>
            <br><br>
            <ul>
                ${project_case.description.split('- ').slice(1,4).map(item => `<li>· ${item.trim()}</li><br><br>`).join('')}
            </ul>
            <a href="https://www.google.com" style="color: #d8315b">Case study link</a>
        `
        })
    };

async function retrieveTestimonials(query) {
    const data = await retrieve(query=query, collection="testimonials", k=2);
    data.forEach((testimonial, index) => {
        const renderKey = "testimonial_" + (index+1);
        renders[renderKey] = testimonial.testimonial
        renders[renderKey + "_sign"] = `<b>${testimonial.contact}</b><br><p>${testimonial.company}</p>`
        renders[renderKey + "_img"] = "backend/data/images/" + testimonial.portrait + ".png"
    })
    };
    
async function validateData() {
    let validationResults = []
    for (let placeholder of placeholders) {
        let status = "✅";
        let notes = "";
     
        if (placeholder === "project_steps") {
            if (!renders['project_steps'][0]['cost'].includes("=")) {
                status = "🟨";
                notes = "Hourly rates not found in context, adjust on slide 5";
            }
        }
        validationResults.push({
            'title': placeholder,
            'status': status,
            'notes': notes
        });
    }
    renders['data_validation'] = validationResults;
}

async function renderAll() {
    const searchKeyWords = await extractSearchKeywords();
    console.log("Extracted search keywords: ", searchKeyWords);

    await extractExecSummary();
    console.log("Extracted executive summary");
    
    await extractProjectSteps();
    console.log("Extracted project steps");
    
    await retrieveProjectCases(searchKeyWords);
    console.log("Retrieved reference projects");
    await validateData();
    await retrieveTestimonials(searchKeyWords);
    console.log("Retrieved project testimonials");
    // renders['image_2'] = 'backend/data/images/female_portrait_2.png';
    // renders['image_1'] = 'backend/data/images/male_headshot_1.png';
    doc.render(renders);
    const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE'
    });
    
    fs.writeFileSync(path.resolve(__dirname, 'nexus_retail.pptx'), buf);
}

renderAll();
