/*jshint esversion: 6 */
const novelsController = require('../controllers').novels;
const md_auth = require('../authenticated/authenticated');
const cm = require('connect-multiparty');
const md_upload = cm({ uploadDir: './server/uploads/novels' });

module.exports = (app) => {
    // Home
    app.get('/api/home', novelsController.getHomeNovels);
    // Novels
    app.get('/api/novel/:id/:action', novelsController.getNovel);
    app.get('/api/novels', novelsController.getNovels);
    app.get('/api/novel/image/:novel_img/:thumb', novelsController.getNovelImage);
    app.put('/api/update-novel', md_auth.EditorAuth, novelsController.updateNovel);
    app.post('/api/create-novel', md_auth.EditorAuth, novelsController.createNovel);
    app.post('/api/upload-novel-img/:id', [md_auth.EditorAuth, md_upload], novelsController.uploadNovelImage);
    app.delete('/api/delete-novel/:id', md_auth.EditorAuth, novelsController.deleteNovel);
    // Volumes
    app.post('/api/create-novel-volume', md_auth.EditorAuth, novelsController.createNovelVolume);
    app.put('/api/update-novel-volume', md_auth.EditorAuth, novelsController.updateNovelVolume);
    app.delete('/api/delete-novel-volume/:id', md_auth.EditorAuth, novelsController.deleteNovelVolume);
    // chapters
    app.get('/api/novel-chapter/:id', novelsController.getChapter);
    app.get('/api/novel-chapter-edition/:id', md_auth.EditorAuth, novelsController.getChapterEdition);
    app.get('/api/novel-chapters/:id', novelsController.getNovelChapters);
    app.put('/api/update-chapter', md_auth.EditorAuth, novelsController.updateChapter);
    app.post('/api/create-chapter', md_auth.EditorAuth, novelsController.createChapter);
    app.delete('/api/delete-chapter/:id', md_auth.EditorAuth, novelsController.deleteChapter);
    // chapters comments
    app.post('/api/create-chapter-comment', md_auth.auth, novelsController.createChapterComment);
    app.get('/api/get-chapters-comments/:id', novelsController.getChapterComments);
    app.put('/api/update-chapter-comment', md_auth.auth, novelsController.updateChapterComment);
    app.delete('/api/delete-chapter-comment/:id', md_auth.auth, novelsController.deleteChapterComment);
    // chapters comments replys
    app.post('/api/create-chapter-comment-reply', md_auth.auth, novelsController.createChapterCommentReply);
    app.get('/api/get-chapter-comment-replys/:id', novelsController.getChapterCommentReplys);
    app.put('/api/update-chapter-comment-reply', md_auth.auth, novelsController.updateChapterCommentReply);
    app.delete('/api/delete-chapter-comment-reply/:id', md_auth.auth, novelsController.deleteChapterCommentReply);
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
    app.post('/api/create-chapter-comment-reply-like', md_auth.auth, novelsController.createChapterCommentReplyLike);
    app.delete('/api/delete-chapter-comment-reply-like/:id', md_auth.auth, novelsController.deleteChapterCommentReplyLike);
};