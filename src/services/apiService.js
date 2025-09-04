import axios from "axios";

export async function sendToApi(content) {
    // Example: POST request
    const res = await axios.post("https://example.com/api/transform", {
        text: content,
    });
    return res.data.result || "";
}
