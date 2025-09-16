import express from 'express';
import cors from 'cors';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const port = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));

app.get('/api/cries/:id', async (req, res) => {
    const { id } = req.params;
    const oggUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/cries/${id}.ogg`;

    try {
        // --- 이 부분을 수정합니다 ---
        // axios 요청에 User-Agent 헤더를 추가해서 일반 브라우저인 것처럼 위장합니다.
        const response = await axios({
            method: 'get',
            url: oggUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
            }
        });

        res.setHeader('Content-Type', 'audio/mpeg');

        ffmpeg(response.data)
            .inputFormat('ogg')
            .toFormat('mp3')
            .on('error', (err) => {
                console.error('FFMPEG Error:', err.message);
                if (!res.headersSent) {
                    res.status(500).send('Error during audio conversion');
                }
            })
            .pipe(res, { end: true });

    } catch (error) {
        // --- 에러 로그를 더 자세하게 출력하도록 수정합니다 ---
        console.error('Failed to fetch .ogg file. The file might not exist for this Pokemon.');
        // Axios 에러의 상세 정보를 출력합니다.
        if (error.response) {
            console.error('Axios Error Status:', error.response.status);
            console.error('Axios Error Headers:', error.response.headers);
        } else {
            console.error('Axios Error Message:', error.message);
        }

        if (!res.headersSent) {
            res.status(404).send('Audio file not found');
        }
    }
});

app.listen(port, () => {
    console.log(`🔊 Audio proxy server listening on http://localhost:${port}`);
});