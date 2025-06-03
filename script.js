async function fetchComments() {
    const videoId = document.getElementById("videoId").value.trim();
    const startDate = new Date(document.getElementById("startDate").value);
    const endDate = new Date(document.getElementById("endDate").value);
    const keyword = document.getElementById("keyword").value.trim().toLowerCase();
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "Loading...";

    let comments = [];
    let pageToken = "";
    let url;

    try {
        do {
            url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=100&pageToken=${pageToken}&key=${API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            pageToken = data.nextPageToken || "";

            for (const item of data.items) {
                // Top-level comment
                const comment = item.snippet.topLevelComment.snippet;
                const commentDate = new Date(comment.publishedAt);

                if ((!isNaN(startDate) && commentDate < startDate) || (!isNaN(endDate) && commentDate > endDate)) continue;
                if (keyword && !comment.textDisplay.toLowerCase().includes(keyword)) continue;

                comments.push({
                    type: "댓글",
                    author: comment.authorDisplayName,
                    text: comment.textDisplay,
                    publishedAt: comment.publishedAt,
                    likeCount: comment.likeCount
                });

                // Replies (대댓글)
                if (item.replies && item.replies.comments) {
                    for (const reply of item.replies.comments) {
                        const replyDate = new Date(reply.snippet.publishedAt);
                        if ((!isNaN(startDate) && replyDate < startDate) || (!isNaN(endDate) && replyDate > endDate)) continue;
                        if (keyword && !reply.snippet.textDisplay.toLowerCase().includes(keyword)) continue;

                        comments.push({
                            type: "대댓글",
                            author: reply.snippet.authorDisplayName,
                            text: reply.snippet.textDisplay,
                            publishedAt: reply.snippet.publishedAt,
                            likeCount: reply.snippet.likeCount
                        });
                    }
                }
            }
        } while (pageToken);

        if (comments.length === 0) {
            resultsDiv.innerHTML = "<p>No matching comments found.</p>";
            return;
        }

        // Sort comments by date (newest first)
        comments.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        let table = "<table><thead><tr><th>#</th><th>Author</th><th>Comment</th><th>Likes</th><th>Date</th><th>Type</th></tr></thead><tbody>";
        comments.forEach((c, index) => {
            table += `<tr>
                        <td>${index + 1}</td>
                        <td>${c.author}</td>
                        <td>${c.text}</td>
                        <td>${c.likeCount}</td>
                        <td>${new Date(c.publishedAt).toLocaleString()}</td>
                        <td>${c.type}</td>
                      </tr>`;
        });
        table += "</tbody></table>";
        resultsDiv.innerHTML = table;
    } catch (err) {
        console.error(err);
        resultsDiv.innerHTML = "<p>Error fetching comments. Check video ID and API key.</p>";
    }
}
