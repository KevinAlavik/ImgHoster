const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 8008;
const serverUrl = "https://files.melker.gay"

const embedColor = "#43B581"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "uploads"));
    },
    filename: function (req, file, cb) {
        const uniqueFileName = uuidv4();
        cb(null, uniqueFileName + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

function getPageAbsolutePath(name) {
    return path.join(__dirname, "pages", name);
}

function getUploadedImagePath(name) {
    return `/images/${name}`;
}

function getUploadedPageAbsolutePath(name) {
    return path.join(__dirname, "pages", "images", name);
}

app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
    res.sendFile(getPageAbsolutePath("index.html"));
});

app.get("/upload", (req, res) => {
    res.sendFile(getPageAbsolutePath("upload.html"));
});

app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }

    const uploadedFileName = req.file.filename;
    const htmlFileName = uuidv4();
    const imageUrl = serverUrl + getUploadedImagePath(uploadedFileName);

    const htmlContent = `
    <!DOCTYPE html>
    <html>
        <head>
            <meta content="${uploadedFileName}" property="og:title" />
            <meta content="${serverUrl + htmlFileName}" property="og:url" />
            <meta content="${imageUrl}" property="og:image" />
            <meta content="${embedColor}" data-react-helmet="true" name="theme-color" />
            <style>
                body, html {
                    margin: 0;
                    height: 100%;
                    background-image: url("${getUploadedImagePath(uploadedFileName)}");
                    background-size: cover;
                    background-position: center;
                }
            </style>
        </head>
        <body></body>
    </html>`;

    const newHTMLFilePath = getUploadedPageAbsolutePath(`${htmlFileName}.html`);

    fs.writeFile(newHTMLFilePath, htmlContent, (err) => {
        if (err) {
            return res.status(500).send("Error uploading file.");
        }
        const udid = uuidv4();
        app.get(`/${udid}`, (req, res) => {
            res.sendFile(newHTMLFilePath);
        });
        res.redirect(`/${udid}`);
    });

});

app.get("/gallery", (req, res) => {
    res.sendFile(getPageAbsolutePath("gallery.html"));
});

app.use('/images', express.static(path.join(__dirname, 'pages', 'images')));

app.listen(port, () => {
    console.log("Server listening on port " + port);
});
