/*jshint esversion: 6 */
const novelsController = require('../controllers').novels;
const md_auth = require('../authenticated/authenticated');
const cm = require('connect-multiparty');
const md_upload = cm({ uploadDir: './server/uploads/novels' });

module.exports = (app) => {
    // Novels
    app.get('/api/novel/:id/:action', novelsController.getNovel);
    app.get('/api/novels', novelsController.getNovels);
    app.get('/api/novel/image/:novel_img/:thumb', novelsController.getNovelImage);
    app.put('/api/update-novel', md_auth.auth, novelsController.updateNovel);
    app.post('/api/create-novel', md_auth.auth, novelsController.createNovel);
    app.post('/api/upload-novel-img/:id', [md_auth.auth, md_upload], novelsController.uploadNovelImage);
    app.delete('/api/delete-novel/:id', md_auth.auth, novelsController.deleteNovel);
    // chapters
    app.get('/api/novel-chapter/:id', novelsController.getChapter);
    app.get('/api/novel-chapters/:id', novelsController.getNovelChapters);
    app.put('/api/update-chapter', md_auth.auth, novelsController.updateChapter);
    app.post('/api/create-chapter', md_auth.auth, novelsController.createChapter);
    app.delete('/api/delete-chapter/:id', md_auth.auth, novelsController.deleteChapter);
    // chapters comments
    app.post('/api/create-chapter-comment', md_auth.auth, novelsController.createChapterComment);
    app.get('/api/get-chapters-comments/:id', novelsController.getChapterComments);
    app.put('/api/update-chapter-comment', md_auth.auth, novelsController.updateChapterComment);
    app.delete('/api/delete-chapter-comment/:id', md_auth.auth, novelsController.deleteChapterComment);
    // Genres
    app.get('/api/genres', novelsController.getGenres);
    // Novels ratings
    app.post('/api/create-novel-rating', md_auth.auth, novelsController.createNovelRating);
    app.put('/api/update-novel-rating', md_auth.auth, novelsController.updateNovelRating);
    app.delete('/api/delete-novel-rating/:id', md_auth.auth, novelsController.deleteNovelRating);
    // Novels ratings Comments
    app.post('/api/create-novel-rating-comment', md_auth.auth, novelsController.createNovelRatingComment);
    app.get('/api/get-novel-rating-comments/:id', novelsController.getNovelRatingComments);
    app.put('/api/update-novel-rating-comment', md_auth.auth, novelsController.updateNovelRatingComment);
    app.delete('/api/delete-novel-rating-comment/:id', md_auth.auth, novelsController.deleteNovelRatingComment);
    // Test
    app.get('/api/test', novelsController.getnovelsTest);
    // Likes
    app.post('/api/create-novel-rating-like', md_auth.auth, novelsController.createNovelRatingLike);
    app.delete('/api/delete-novel-rating-like/:id', md_auth.auth, novelsController.deleteNovelRatingLike);
    app.post('/api/create-novel-rating-comment-like', md_auth.auth, novelsController.createNovelRatingCommentLike);
    app.delete('/api/delete-novel-rating-comment-like/:id', md_auth.auth, novelsController.deleteNovelCommentRatingLike);
    app.post('/api/create-chapter-comment-like', md_auth.auth, novelsController.createChapterCommentLike);
    app.delete('/api/delete-chapter-comment-like/:id', md_auth.auth, novelsController.deleteChapterCommentLike);
};