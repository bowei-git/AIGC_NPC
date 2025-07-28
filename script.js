document.addEventListener('DOMContentLoaded', () => {
    const gameScreenElement = document.querySelector('.game-screen');
    const npcNameElement = document.getElementById('npc-name');
    const npcDialogueTextElement = document.getElementById('npc-dialogue-text');
    const playerInputElement = document.getElementById('player-input');
    const sendButton = document.getElementById('send-button');

    // --- Google Gemini API 設定 ---
    const GEMINI_API_ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'; // 使用 2.0 Flash 模型
    // API金鑰 簡易設定
    const GEMINI_API_KEY = ''; 
    // --- 提示工程：定義附加的指示(以遊戲RDR2為範例) ---
    const LENGTH_CONSTRAINT_PROMPT = 
    "(請用最多50個字回答，我想問碧血狂殺2的問題，請你不要在回答問題的時候提到'碧血狂殺2'，並且假如問題無關碧血狂殺2->請你回答'這我不知道......'，以下為問題：)"; // 指示模型限制

    const backgroundImages = [
        '/Users/bowei/Desktop/AIGC_NPC/123.jpg',
        '/Users/bowei/Desktop/AIGC_NPC/456.jpg',
        '/Users/bowei/Desktop/AIGC_NPC/91011.jpg',
        '/Users/bowei/Desktop/AIGC_NPC/789.jpg'
    ];
    let currentBgIndex = 0;

    async function handleSend() {
        const playerText = playerInputElement.value.trim();

        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
             npcDialogueTextElement.textContent = "(錯誤：請在程式碼中設定您的 Gemini API Key)";
             console.error("錯誤：Gemini API Key 未設定！");
             return;
        }

        if (playerText) {
            console.log("玩家輸入:", playerText);

            playerInputElement.disabled = true;
            sendButton.disabled = true;
            npcDialogueTextElement.textContent = "嗯...";

            // --- 建構 Gemini API Payload，加入提示工程指令 ---
            const combinedInput = LENGTH_CONSTRAINT_PROMPT + playerText ; // 將用戶輸入和字數限制指令結合
            console.log("發送給 API 的完整提示:", combinedInput); // 方便調試

            const requestPayload = {
                contents: [
                    {
                        parts: [
                            {
                                text: combinedInput // 使用結合後的提示
                            }
                        ]
                    }
                ]
            };

            const requestUrl = `${GEMINI_API_ENDPOINT_BASE}?key=${GEMINI_API_KEY}`;

            try {
                const response = await fetch(requestUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestPayload)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: "無法解析錯誤回應" }));
                    console.error('API Error Response:', errorData);
                    const errorMessage = errorData?.error?.message || errorData?.message || `API請求失敗: ${response.status} ${response.statusText}`;
                    throw new Error(errorMessage);
                }

                const data = await response.json();

                let npcResponse = "(NPC 似乎不知道該說什麼...)"; // 預設值
                if (data.candidates && data.candidates.length > 0 &&
                    data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
                    npcResponse = data.candidates[0].content.parts[0].text;
                } else {
                     console.warn('API 回應了，但沒有有效的候選答案或內容:', data);
                    if (data.promptFeedback && data.promptFeedback.blockReason) {
                        npcResponse = `(內容被阻止: ${data.promptFeedback.blockReason})`;
                    }
                }

                // --- 移除前端截斷 ---
                // const truncatedNpcResponse = rawNpcResponse.substring(0, MAX_CHAR_LIMIT); // 不再需要這行

                npcDialogueTextElement.textContent = npcResponse; // 直接顯示模型的回應

            } catch (error) {
                console.error('呼叫 Gemini API 時發生錯誤:', error);
                npcDialogueTextElement.textContent = `(發生錯誤: ${error.message})`;
            } finally {
                playerInputElement.disabled = false;
                sendButton.disabled = false;
                playerInputElement.focus();
            }

            // 切換背景 (保留)
             if (backgroundImages.length > 0) {
                currentBgIndex = (currentBgIndex + 1) % backgroundImages.length;
                const nextBgImage = backgroundImages[currentBgIndex];
                gameScreenElement.style.backgroundImage = `url('${nextBgImage}')`;
            }

            playerInputElement.value = '';

        } else {
            playerInputElement.focus();
        }
    }

    sendButton.addEventListener('click', handleSend);
    playerInputElement.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' || event.keyCode === 13) {
            event.preventDefault();
            handleSend();
        }
    });
});
