const API_KEY = "AIzaSyAkfCHE1dqfD0MDWcAzc3sNlDLBGq0zKrE";

async function fetchComments() {
    const videoId = document.getElementById("videoId").value.trim();
    const startDate = new Date(document.getElementById("startDate").value);
    const endDate = new Date(document.getElementById("endDate").value);
    const keyword = document.getElementById("keyword").value.trim().toLowerCase();
    const resultsDiv = document.getElementById("results");

    const statusSpan = document.getElementById("status");
    statusSpan.innerText = "조회 중...";
    let count = 0;

    resultsDiv.innerHTML = "Loading...";

    let comments = [];
    let pageToken = "";

    try {
        // Step 1: Fetch all top-level comments
        do {
            const threadUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&pageToken=${pageToken}&key=${API_KEY}`;
            const threadRes = await fetch(threadUrl);
            const threadData = await threadRes.json();

            pageToken = threadData.nextPageToken || "";

            for (const item of threadData.items) {
                const topComment = item.snippet.topLevelComment.snippet;
                const commentDate = new Date(topComment.publishedAt);
                const isInRange = (!isNaN(startDate) ? commentDate >= new Date(startDate.setHours(0, 0, 0, 0)) : true) &&
                                  (!isNaN(endDate) ? commentDate <= new Date(endDate.setHours(23, 59, 59, 999)) : true);
                const hasKeyword = !keyword || topComment.textDisplay.toLowerCase().includes(keyword);

                if (isInRange && hasKeyword) {
                    comments.push({
                        type: "댓글",
                        author: topComment.authorDisplayName,
                        text: topComment.textDisplay,
                        publishedAt: topComment.publishedAt,
                        likeCount: topComment.likeCount
                    });
                    count++;
                    statusSpan.innerText = `조회 중... (${count}개 수집됨)`;
                        author: topComment.authorDisplayName,
                        text: topComment.textDisplay,
                        publishedAt: topComment.publishedAt,
                        likeCount: topComment.likeCount
                    });
                }

                // Step 2: Fetch all replies (if any)
                const parentId = item.snippet.topLevelComment.id;
                let replyToken = "";
                do {
                    const replyUrl = `https://www.googleapis.com/youtube/v3/comments?part=snippet&parentId=${parentId}&maxResults=100&pageToken=${replyToken}&key=${API_KEY}`;
                    const replyRes = await fetch(replyUrl);
                    const replyData = await replyRes.json();

                    replyToken = replyData.nextPageToken || "";

                    for (const reply of replyData.items || []) {
                        const replySnippet = reply.snippet;
                        const replyDate = new Date(replySnippet.publishedAt);
                        const replyInRange = (!isNaN(startDate) ? replyDate >= new Date(startDate.setHours(0, 0, 0, 0)) : true) &&
                                             (!isNaN(endDate) ? replyDate <= new Date(endDate.setHours(23, 59, 59, 999)) : true);
                        const replyHasKeyword = !keyword || replySnippet.textDisplay.toLowerCase().includes(keyword);

                        if (replyInRange && replyHasKeyword) {
                            comments.push({
                                type: "대댓글",
                                author: replySnippet.authorDisplayName,
                                text: replySnippet.textDisplay,
                                publishedAt: replySnippet.publishedAt,
                                likeCount: replySnippet.likeCount
                            });
                            count++;
                            statusSpan.innerText = `조회 중... (${count}개 수집됨)`;
                                author: replySnippet.authorDisplayName,
                                text: replySnippet.textDisplay,
                                publishedAt: replySnippet.publishedAt,
                                likeCount: replySnippet.likeCount
                            });
                        }
                    }

                } while (replyToken);

            }
        } while (pageToken);

        // 결과 처리
        if (comments.length === 0) {
            resultsDiv.innerHTML = "<p>No matching comments found.</p>";
            return;
        }

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
        statusSpan.innerText = `조회 완료: 총 ${comments.length}개`;
        resultsDiv.innerHTML = table;
    } catch (err) {
        console.error(err);
        statusSpan.innerText = "❌ 댓글 조회 실패. 콘솔을 확인하세요.";
        resultsDiv.innerHTML = "<p>Error fetching comments. Check video ID and API key.</p>";
    }
}
