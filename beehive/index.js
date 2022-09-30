
let data = {
    name: "",
    candidate_profile: "",
    location: "",
    languages: [],
    driver: false,
    dbs_check: false,
    first_aid_cert: false,
    education_and_qualifications: "",
    employment_history: [
        // {
        //     date: "02/2019 - PRESENT",
        //     overview: ["Nanny/Cook", "London", "blah"],
        //     description: "Blah blah blah",
        // },
        // {
        //     date: "02/2018 - 02/2019",
        //     overview: ["Nanny/Cook", "London", "blah"],
        //     description: "Blah blah blah",
        // }
    ],
    hobbies: [],
}

function delete_history(item) {
    item.remove();
}
function add_language() {
    const dummy_holder = document.getElementById("dummy");
    const lang_el = document.getElementById("languages_control");
    // todo use append child, or do something like insert inner html somewhere
    // then copy the node and append it as a child to save having to write more js?
    dummy_holder.innerHTML = `<input class="input languages_thing" type="text" placeholder="Language">`
    lang_el.appendChild(dummy_holder.children[0].cloneNode(true));
    dummy_holder.innerHTML = "";
}
function add_another() {
    const dummy_holder = document.getElementById("dummy");
    const history_el = document.getElementById("history_data");
    // Not an amazing solution, but it works.
    dummy_holder.innerHTML = `
        <div class="card history_fields"
            style="margin-bottom: 10px; padding: 16px; background-color: rgba(0, 0, 0, 0.1);">
            <button onclick="delete_history(this.parentElement)">X</button>

            <div style="display:flex">
                <div class="field" style="width:50%">
                    <label class="label">Date</label>
                    <div class="control">
                        <input class="input" type="text" placeholder="Text input" id="date">
                    </div>
                </div>
                <div class="field" style="width:50%">
                    <label class="label">Overview</label>
                    <div class="control">
                        <input class="input" type="text" placeholder="Text input" id="overview">
                    </div>
                </div>
            </div>
            <div class="field">
                <label class="label">Description</label>
                <div class="control">
                    <textarea class="textarea" placeholder="Textarea" id="description"></textarea>
                </div>
            </div>
        </div>
    `
    history_el.appendChild(dummy_holder.children[0].cloneNode(true))
    dummy_holder.innerHTML = "";
}

function format_value(value) {
    if (Array.isArray(value)) {
        value = value.join(" | ");
    } else if (value === true) {
        value = "YES";
    } else if (value === false) {
        value = "NO"
    }
    return value;
}

function format_data_to_table_cell(key, value) {
    let children = [];
    // Special formating for certain keys, only one cell for the row
    const human_key = humanize(key);
    if (key === "candidate_profile" || key === "other" || key === "education_and_qualifications") {
        const textRuns = value.split("\n").map(line=>new docx.TextRun({break:1,text:line}));
        const paragraph = new docx.Paragraph({children: textRuns});
        let sub_children = [];
        if (key !== "other") {
            sub_children.push(new docx.Paragraph({ children: [new docx.TextRun({text: human_key, bold: true})]}));
        }
        sub_children.push(paragraph);
        children.push(
            new docx.TableCell({
                columnSpan: 2,
                children: sub_children,
            })
        );
        return children;
    }

    // Add the key
    children.push(
        new docx.TableCell({
            children: [
                new docx.Paragraph({ children: [new docx.TextRun({text: human_key, bold: true})]}),
            ]
        })
    );
    // Add the value
    value = format_value(value);
    children.push(
        new docx.TableCell({
            children: [
                new docx.Paragraph({ text: value }),
            ]
        })
    );

    return children;
}
function humanize(str) {
    var i, frags = str.split('_');
    for (i = 0; i < frags.length; i++) {
        frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
    }
    return frags.join(' ');
}
function format_data_to_rows(data) {
    let all_rows = [];
    for (const key in data) {
        const value = data[key];
        // When it's an object
        if (Array.isArray(value) && typeof value[0] != "string") {
            all_rows.push(
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 2,
                            children: [new docx.Paragraph({ children: [new docx.TextRun({text: humanize(key), bold: true})]})]
                        })
                    ]
                })
            )
            let other_rows = value.map((item) => {
                all_rows.push(
                    new docx.TableRow({
                        children: format_data_to_table_cell(item.date, item.overview),
                    })
                );
                all_rows.push(
                    new docx.TableRow({
                        children: format_data_to_table_cell("other", item.description),
                    })
                );
            });
        } else {
            all_rows.push(new docx.TableRow({
                children: format_data_to_table_cell(key, value),
            }));
        }
    }
    return all_rows;
}

let data_thing = undefined;
window.onload = () => {
    // TODO: Not this.
    fetch("https://static.wixstatic.com/media/35ef61_17389ff1223f45be92f29c7ca9c5dda5~mv2.png/v1/fill/w_80,h_80,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/nanny%20agency.png").then((resp) => {
        return resp.blob();
    }).then((blob) => {
        data_thing = blob;
    });
}

function extract_data_from_form() {
    data.name = document.getElementById("name").value;
    data.candidate_profile = document.getElementById("candidate_profile").value;
    data.location = document.getElementById("location").value.split(" ");
    data.languages = document.getElementById("language").value.split(" ");
    // for (let item of document.getElementsByClassName("languages_thing")) {
    //     if (item.value) {
    //         data.languages.push(item.value);
    //     }
    // }
    data.driver = document.getElementById("is_driver").checked;
    data.dbs_check = document.getElementById("dbs_check").checked;
    data.first_aid_cert = document.getElementById("first_aid_cert").checked;
    data.education_and_qualifications = document.getElementById("eandq").value;

    data.employment_history = []
    for (let item of document.getElementsByClassName("history_fields")) {
        data.employment_history.push({
            date: item.querySelector("#date").value,
            overview: item.querySelector("#overview").value.split(" "),
            description: item.querySelector("#description").value,
        })
    }
    data.hobbies = document.getElementById("hobbies").value.split(" ");
}

function generate() {
    extract_data_from_form()
    // return;
    const table = new docx.Table({
        width: { size: 8535, type: docx.WidthType.DXA },
        verticalAlign: docx.VerticalAlign.CENTER,
        rows: format_data_to_rows(data),
    });
    let image_field = document.getElementById("file-input-photo")
    const image = new docx.ImageRun({
        data: image_field.files[0],
        transformation: {
            width: 100,
            height: 100,
        },
    });
    const logo = new docx.ImageRun({
        data: data_thing,
        transformation: {
            width: 50,
            height: 50,
        },
    });
    const doc = new docx.Document({
        sections: [
            {
                properties: {},
                headers: {
                    default: new docx.Header({
                        children: [
                            new docx.Paragraph({
                                text: "www.beehivenannyagency.com\nhello@beehivenannyagency.com",
                                alignment: docx.AlignmentType.RIGHT,
                            })
                        ]
                    }),
                },
                children: [
                    new docx.Paragraph({
                        children: [logo],
                    }),
                    new docx.Paragraph({
                        children: [image],
                        alignment: docx.AlignmentType.CENTER,
                    }),
                    table,
                ]
            }
        ]
    });

    saveDocumentToFile(doc, "My Document.docx")
}
function saveDocumentToFile(doc, fileName) {
    // Create new instance of Packer for the docx module

    // Create a mime type that will associate the new file with Microsoft Word
    const mimeType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    // Create a Blob containing the Document instance and the mimeType
    docx.Packer.toBlob(doc).then((blob) => {
        const docblob = blob.slice(0, blob.size, mimeType);
        // Save the file using saveAs from the file-saver package
        saveAs(docblob, fileName);
    });
}

