const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get("videoId");
const startDate = new Date(urlParams.get("startDate"));
const endDate = new Date(urlParams.get("endDate"));
const keyword = (urlParams.get("keyword") || "").toLowerCase();

const statusSpan = document.getElementById("status");
const resultsDiv = document.getElementById("results");
let comments = [];

async function fetchComments() {
    let pageToken = "";
    let count = 0;

    try {
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
                    const parent = {
                        type: "댓글",
                        author: topComment.authorDisplayName,
                        text: topComment.textDisplay,
                        publishedAt: topComment.publishedAt,
                        likeCount: topComment.likeCount
                    };
                    comments.push(parent);
                    count++;
                    statusSpan.innerText = `조회 중... (${count}개 수집됨)`;

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
                            }
                        }
                    } while (replyToken);
                }
            }
        } while (pageToken);

        if (comments.length === 0) {
            resultsDiv.innerHTML = "<p>No matching comments found.</p>";
            statusSpan.innerText = "조회 결과 없음";
            return;
        }

        let table = "<button onclick='downloadComments()'>댓글 다운로드</button>";
        table += "<table><thead><tr><th>#</th><th>Author</th><th>Comment</th><th>Likes</th><th>Date</th><th>Type</th></tr></thead><tbody>";
        let index = 1;
        for (const c of comments) {
            table += `<tr>
                        <td>${index++}</td>
                        <td>${c.author}</td>
                        <td>${c.text}</td>
                        <td>${c.likeCount}</td>
                        <td>${new Date(c.publishedAt).toLocaleString()}</td>
                        <td>${c.type}</td>
                      </tr>`;
        }
        table += "</tbody></table>";
        resultsDiv.innerHTML = table;
        statusSpan.innerText = `조회 완료: 총 ${comments.length}개`;

    } catch (err) {
        console.error(err);
        statusSpan.innerText = "❌ 댓글 조회 실패. 콘솔을 확인하세요.";
        resultsDiv.innerHTML = "<p>Error fetching comments. Check video ID and API key.</p>";
    }
}

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.map(f => `"${f}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "youtube_comments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

fetchComments();

function downloadComments() {
    const rows = [["번호", "작성자", "내용", "좋아요수", "날짜", "타입"]];
    let index = 1;
    for (const c of comments) {
        rows.push([
            index++,
            c.author,
            c.text.replace(/\n/g, " "),
            c.likeCount,
            new Date(c.publishedAt).toLocaleString(),
            c.type
        ]);
    }
    const csvContent = "\uFEFF" + rows.map(e => e.map(f => `"${f}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "youtube_comments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}