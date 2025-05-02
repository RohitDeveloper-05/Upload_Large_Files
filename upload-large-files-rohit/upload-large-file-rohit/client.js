import fs from 'fs';
import axios from 'axios';
import mime from 'mime-types';

const file = 'SQL_Notes.pdf';
const apiUrl = 'https://59ryqiksy4.execute-api.us-east-1.amazonaws.com/Stage/upload';

// Read the file content and detect the file type
const fileContent = fs.readFileSync(file);
const detectedType = mime.lookup(file);
const contentType = detectedType ? detectedType : 'application/octet-stream';

// Send a POST request to the API Gateway endpoint to get the pre-signed URL and file key
axios
    .post(
        apiUrl,
        { filename: file },
        {
            headers: { 'Content-Type': 'application/json' },
        },
    )
    .then((response) => {
        // Get the pre-signed URL and file key from the response
        const { uploadUrl, fileKey } = response.data;
        console.log("Printing the extension for the file",contentType)

        // Send a PUT request to the pre-signed URL with the form data
        console.log(contentType)
        axios
            .put(uploadUrl, fileContent, {
                headers: {
                    'Content-Type': contentType,
                },
            })
            .then(() => {
                console.log(`File uploaded successfully to S3: ${fileKey}`);
            })
            .catch((error) => {
                console.error('Error uploading file to S3:', error);
            });
    })
    .catch((error) => {
        console.error('Error getting pre-signed URL:', error);
    });
