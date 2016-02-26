/*
 Copyright (C) 2015  PencilBlue, LLC

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

//dependencies
var util  = require('../../../util.js');
var async = require('async');

module.exports = function(pb) {

    //pb dependencies
    var DAO            = pb.DAO;

    /**
     * Retrieves the necessary data as well as prepares the layout so a view
     * loader can complete the render of content
     * @class ArticleRenderer
     * @constructor
     */
    function ArticleRenderer(context) {
        if (context) {
            this.commentService = new pb.CommentService(context);
            this.hostname = context.hostname;
        }
        this.site = pb.SiteService.getCurrentSite(context.site);
        this.onlyThisSite = context.onlyThisSite;
        //console.log(context);
    }

    /**
     * @private
     * @static
     * @readonly
     * @property READ_MORE_FLAG
     * @type {String}
     */
    var READ_MORE_FLAG = '^read_more^';
    var READ_MORE_FLAG_EN = '^read_more_en^';

    /**
     * @method render
     * @param {Object} content
     * @param {Object} context
     * @param {Object} [context.authors] A hash of user objects representing the
     * authors of the content to be rendered
     * @param {Object} context.contentSettings The content settings
     * @param {Integer} context.contentCount An integer representing the total
     * number of content objects that will be processed for this request
     * @param {Boolean} [context.renderBylines=true]
     * @param {Boolean} [context.renderTimestamp=true]
     * @param {Boolean} [context.renderComments=true]
     * @param {Boolean} [context.readMore=false]
     * @param {Function} cb
     */
    ArticleRenderer.prototype.render = function(content, context, cb) {
        if (!util.isObject(content)) {
            return cb(new Error('content parameter must be a valid object'));
        }
        else if (!util.isObject(context)) {
            return cb(new Error('context parameter must be a valid object'));
        }
        else if (!util.isObject(context.authors) && context.renderBylines !== false) {
            return cb(new Error('context.authors parameter must be a valid hash of users when the bylines will be rendered'));
        }
        else if (!util.isObject(context.contentSettings)) {
            return cb(new Error('context.contentSettings parameter must be a valid hash of content settings'));
        }
        else if (isNaN(context.contentCount)) {
            return cb(new Error('context.contentCount parameter must be a valid integer greater than 0'));
        }

        if (context.renderBylines !== false) {
            this.formatBylines(content, context);
        }
        if (context.renderTimestamp !== false) {
            this.formatTimestamp(content, context);
        }
        //console.log(context.contentSettings.read_more_text == 'Read more');
        //build out task list
        this.formatLayout(content, context);
        if(context.contentSettings.read_more_text === 'Read more') {
            //this.formatLayoutEn(content, context);

            //build out task list
            var tasks = [
                util.wrapTask(this, this.formatMediaReferencesEn, [content, context])
            ];
        }else{


            //build out task list
            var tasks = [
                util.wrapTask(this, this.formatMediaReferences, [content, context])
            ];
        }
        //render comments unless explicitly asked not too
        if (context.renderComments !== false) {
            tasks.push(util.wrapTask(this, this.formatComments, [content, context]));
        }

        //run the tasks
        async.parallel(tasks, function(err/*, results*/) {
            cb(err, content);
        });
    };

    /**
     * @method formatBylines
     * @param {Object} content
     * @param {Object} context
     */
    ArticleRenderer.prototype.formatBylines = function(content, context) {

        var author = context.authors[content.author];
        if (util.isNullOrUndefined(author)) {
            pb.log.warn('ArticleRenderer: Failed to find author [%s] for content [%s]', content.author, content[DAO.getIdField()]);
            return;
        }

        var contentSettings = context.contentSettings;
        if(author.photo && contentSettings.display_author_photo) {
            content.author_photo     = author.photo;
            content.media_body_style = '';
        }

        content.author_name     = pb.users.getFormattedName(author);
        content.author_position = '';
        if (author.position && contentSettings.display_author_position) {
            content.author_position = author.position;
        }
    };

    /**
     * @method formatTimestamp
     * @param {Object} content
     * @param {Object} context
     */
    ArticleRenderer.prototype.formatTimestamp = function(content, context) {
        if(context.contentSettings.display_timestamp ) {
            content.timestamp = pb.ContentService.getTimestampTextFromSettings(
              content.publish_date,
              context.contentSettings
            );
        }
    };

    /**
     * @method formatLayout
     * @param {Object} content
     * @param {Object} context
     */
    ArticleRenderer.prototype.formatLayout = function(content, context) {
        var contentSettings = context.contentSettings;
        if(this.containsReadMoreFlag(content)) {
            this.formatLayoutForReadMore(content, context);
        }
        else if(context.readMore && contentSettings.auto_break_articles) {
            this.formatAutoBreaks(content, context);
        }
    };

    ArticleRenderer.prototype.formatLayoutEn = function(content, context) {
        var contentSettings = context.contentSettings;

        if(this.containsReadMoreFlagEn(content)) {
            this.formatLayoutForReadMoreEn(content, context);
        }
        else if(context.readMore && contentSettings.auto_break_articles) {
            this.formatAutoBreaksEn(content, context);
        }
    };

    /**
     * @method formatMediaReferences
     * @param {Object} content
     * @param {Object} context
     * @param {Function} cb
     */
    ArticleRenderer.prototype.formatMediaReferences = function(content, context, cb) {
        var self = this;
        content.thumbnail_layout = '^media_display_'+content.thumbnail+'/position:center,maxHeight:100px^';
        content.layout  = this.getLayout(content);
        var mediaLoader = new pb.MediaLoader({site: self.site, onlyThisSite: self.onlyThisSite});
        mediaLoader.start(content.layout, function(err, newLayout) {
            content.layout = newLayout;
            mediaLoader.start(content.thumbnail_layout, function(err, newThumbnailLayout){
                content.thumbnail_layout = newThumbnailLayout;
                self.setLayout(content, undefined);
            });
            cb(err);
        });
    };

    ArticleRenderer.prototype.formatMediaReferencesEn = function(content, context, cb) {
        var self = this;
        content.thumbnail_layout = '^media_display_'+content.thumbnail+'/position:center,maxHeight:100px^';
        content.layout  = this.getLayoutEn(content);
        var mediaLoader = new pb.MediaLoader({site: self.site, onlyThisSite: self.onlyThisSite});
        mediaLoader.start(content.layout, function(err, newLayout) {
            content.layout = newLayout;
            mediaLoader.start(content.thumbnail_layout, function(err, newThumbnailLayout){
                content.thumbnail_layout = newThumbnailLayout;
                self.setLayout(content, undefined);
                //console.log(content.layout);
            });
            //console.log(content.thumbnail_layout);
            cb(err);
        });
    };

    /**
     * @method formatComments
     * @param {Object} content
     * @param {Object} context
     * @param {Function} cb
     */
    ArticleRenderer.prototype.formatComments = function(content, context, cb) {
        var self = this;
        if (!pb.ArticleService.allowComments(context.contentSettings, content)) {
            return cb(null);
        }

        var opts = {
            where: {
                article: content[pb.DAO.getIdField()] + ''
            },
            order: {
                created: pb.DAO.ASC
            }
        };
        this.commentService.getAll(opts, function(err, comments) {
            if(util.isError(err) || comments.length == 0) {
                return cb(err);
            }

            self.getCommenters(comments, context.contentSettings, function(err, commentsWithCommenters) {
                content.comments = commentsWithCommenters;
                cb(null, null);
            });
        });
    };

    /**
     * Retrieves the commenters for an array of comments
     *
     * @method getCommenters
     * @param {Array} comments Array of comment objects
     * @param {Object} contentSettings Content settings to use for processing
     * @param {Function} cb Callback function
     */
    ArticleRenderer.prototype.getCommenters = function(comments, contentSettings, cb) {

        //callback for iteration to handle setting the commenter attributes
        var processComment = function(comment, commenter) {
            comment.commenter_name = 'Anonymous';
            comment.timestamp      = pb.ContentService.getTimestampTextFromSettings(comment.created, contentSettings);

            if (commenter) {
                comment.commenter_name = pb.users.getFormattedName(commenter);
                if(commenter.photo) {
                    comment.commenter_photo = commenter.photo;
                }
                if(commenter.position) {
                    comment.commenter_position = commenter.position;
                }
            }
        };

        var processedComments = [];
        var users             = {};
        var tasks             = util.getTasks(comments, function(comments, i) {
            return function(callback) {

                var comment   = comments[i];
                if (!comment.commenter || users[comment.commenter]) {

                    //user already commented so pull locally
                    processComment(comment, users[comment.commenter]);
                    processedComments.push(comment);
                    callback(null, true);
                    return;
                }

                //user has not already commented so load
                var dao = new pb.DAO();
                dao.loadById(comment.commenter, 'user', function(err, commenter) {
                    if(util.isError(err) || commenter == null) {
                        callback(null, false);
                        return;
                    }

                    //process the comment
                    users[commenter[pb.DAO.getIdField()].toString()] = commenter;
                    processComment(comment, commenter);
                    processedComments.push(comment);

                    callback(null, true);
                });
            };
        });
        async.series(tasks, function(err, result) {
            cb(err, processedComments);
        });
    };

    /**
     * @method formatAutoBreak
     * @param {Object} content
     * @param {Object} context
     */
    ArticleRenderer.prototype.formatAutoBreaks = function(content, context) {
        var contentSettings = context.contentSettings;
        var breakString = '<br>';
        var tempLayout;
        var layout = this.getLayout(content);
        layout = layout.substr(0,155);
        var bHtml = layout.indexOf('<b>');
        var iHtml = layout.indexOf('<i>');
        var uHtml = layout.indexOf('<u>');
        var sHtml = layout.indexOf('<strike>');
        while(bHtml === 0 || iHtml === 0 || uHtml === 0 || sHtml === 0){
            //console.log(bHtml);
            if(sHtml === 0){
                layout = layout.substr(5,150);
            }
            layout = layout.substr(3,150);
            bHtml = layout.indexOf('<b>');
            iHtml = layout.indexOf('<i>');
            uHtml = layout.indexOf('<u>');
            sHtml = layout.indexOf('<strike>');
        };
        layout = layout + '...<div><br></div>';
        //console.log(layout);

        // Firefox uses br and Chrome uses div in content editables.
        // We need to see which one is being used
        var brIndex = layout.indexOf('<br>');
        if(brIndex === -1) {
            brIndex = layout.indexOf('<br />');
            breakString = '<br />';
        }
        var divIndex = layout.indexOf('</div>');

        // Temporarily replace double breaks with a directive so we don't mess up the count
        if(divIndex === -1 || (brIndex > -1 && divIndex > -1 && brIndex < divIndex)) {
            tempLayout = layout.split(breakString + breakString).join(breakString + '^dbl_pgf_break^');
        }
        else {
            breakString = '</div>';
            tempLayout = layout.split('<div><br></div>').join(breakString + '^dbl_pgf_break^')
              .split('<div><br /></div>').join(breakString + '^dbl_pgf_break^');
        }

        // Split the layout by paragraphs and remove any empty indices
        var tempLayoutArray = tempLayout.split(breakString);
        for(var i = 0; i < tempLayoutArray.length; i++) {
            if(!tempLayoutArray[i].length) {
                tempLayoutArray.splice(i, 1);
                i--;
            }
        }

        // Only continue if we have more than 1 paragraph
        if(tempLayoutArray.length > 1) {
            var newLayout = '';

            // Cutoff the content at the right number of paragraphs
            for(i = 0; i < tempLayoutArray.length && i < contentSettings.auto_break_articles; i++) {
                if(i === contentSettings.auto_break_articles - 1 && i != tempLayoutArray.length - 1) {
                    newLayout += tempLayoutArray[i] + this.getReadMoreSpan(content, contentSettings.read_more_text) + breakString;
                    continue;
                }
                newLayout += tempLayoutArray[i] + breakString;
            }

            if(breakString === '</div>') {
                breakString = '<div><br /></div>';
            }

            // Replace the double breaks
            newLayout = newLayout.split('^dbl_pgf_break^').join(breakString);
            //console.log(content);
            this.setLayout(content, newLayout);
        }
    };

    ArticleRenderer.prototype.formatAutoBreaksEn = function(content, context) {
        var contentSettings = context.contentSettings;
        var breakString = '<br>';
        var tempLayout;
        var layout = this.getLayoutEn(content);
        layout = layout.substr(0,155);
        var bHtml = layout.indexOf('<b>');
        var iHtml = layout.indexOf('<i>');
        var uHtml = layout.indexOf('<u>');
        var sHtml = layout.indexOf('<strike>');
        while(bHtml === 0 || iHtml === 0 || uHtml === 0 || sHtml === 0){
            //console.log(bHtml);
            if(sHtml === 0){
                layout = layout.substr(5,150);
            }
            layout = layout.substr(3,150);
            bHtml = layout.indexOf('<b>');
            iHtml = layout.indexOf('<i>');
            uHtml = layout.indexOf('<u>');
            sHtml = layout.indexOf('<strike>');
        };
        layout = layout + '...<div><br></div>';
        //console.log(layout);

        // Firefox uses br and Chrome uses div in content editables.
        // We need to see which one is being used
        var brIndex = layout.indexOf('<br>');
        if(brIndex === -1) {
            brIndex = layout.indexOf('<br />');
            breakString = '<br />';
        }
        var divIndex = layout.indexOf('</div>');

        // Temporarily replace double breaks with a directive so we don't mess up the count
        if(divIndex === -1 || (brIndex > -1 && divIndex > -1 && brIndex < divIndex)) {
            tempLayout = layout.split(breakString + breakString).join(breakString + '^dbl_pgf_break^');
        }
        else {
            breakString = '</div>';
            tempLayout = layout.split('<div><br></div>').join(breakString + '^dbl_pgf_break^')
                .split('<div><br /></div>').join(breakString + '^dbl_pgf_break^');
        }

        // Split the layout by paragraphs and remove any empty indices
        var tempLayoutArray = tempLayout.split(breakString);
        for(var i = 0; i < tempLayoutArray.length; i++) {
            if(!tempLayoutArray[i].length) {
                tempLayoutArray.splice(i, 1);
                i--;
            }
        }

        // Only continue if we have more than 1 paragraph
        if(tempLayoutArray.length > 1) {
            var newLayout = '';

            // Cutoff the content at the right number of paragraphs
            for(i = 0; i < tempLayoutArray.length && i < contentSettings.auto_break_articles; i++) {
                if(i === contentSettings.auto_break_articles - 1 && i != tempLayoutArray.length - 1) {

                    newLayout += tempLayoutArray[i] + this.getReadMoreSpanEn(content, contentSettings.read_more_text) + breakString;
                    continue;
                }
                newLayout += tempLayoutArray[i] + breakString;
            }

            if(breakString === '</div>') {
                breakString = '<div><br /></div>';
            }

            // Replace the double breaks
            newLayout = newLayout.split('^dbl_pgf_break^').join(breakString);

            this.setLayoutEn(content, newLayout);
        }
    };

    /**
     * @method formatLayoutForReadMore
     * @param {Object} content
     * @param {Objct} context
     */
    ArticleRenderer.prototype.formatLayoutForReadMore = function(content, context) {
        var layout = this.getLayout(content);

        if(context.readMore) {
            var beforeReadMore = layout.substr(0, layout.indexOf(READ_MORE_FLAG));
            layout = beforeReadMore + this.getReadMoreSpan(content, context.contentSettings.read_more_text);
        }
        else {
            layout = layout.split(READ_MORE_FLAG).join('');
        }
        this.setLayout(content, layout);
    };

    ArticleRenderer.prototype.formatLayoutForReadMoreEn = function(content, context) {
        var layout = this.getLayoutEn(content);

        if(context.readMore) {
            var beforeReadMore = layout.substr(0, layout.indexOf(READ_MORE_FLAG));
            layout = beforeReadMore + this.getReadMoreSpanEn(content, context.contentSettings.read_more_text);
        }
        else {
            layout = layout.split(READ_MORE_FLAG).join('');
        }
        this.setLayoutEn(content, layout);
    };

    /**
     *
     * @method getReadMoreSpan
     * @param {Object} content
     * @param {String} anchorContent
     * @return {String}
     */
    ArticleRenderer.prototype.getReadMoreSpan = function(content, anchorContent) {
        return '<span>' + this.getReadMoreLink(content, anchorContent) + '</span>';
    };

    ArticleRenderer.prototype.getReadMoreSpanEn = function(content, anchorContent) {
        return '&nbsp;<span class="read_more">' + this.getReadMoreLinkEn(content, anchorContent) + '</span>';
    };

    /**
     * @method getReadMoreLink
     * @param {Object} content
     * @param {String} anchorContent
     * @return {String}
     */
    ArticleRenderer.prototype.getReadMoreLink = function(content, anchorContent) {
        var path = pb.UrlService.urlJoin(this.getContentLinkPrefix() + content.url);
        return '<a class="read-more" href="' + pb.UrlService.createSystemUrl(path, { hostname: this.hostname }) + '">' + anchorContent + '</a>';
    };

    ArticleRenderer.prototype.getReadMoreLinkEn = function(content, anchorContent) {

        var path = pb.UrlService.urlJoin(this.getContentLinkPrefixEn() + content.url);
        return '<a href="' + pb.UrlService.createSystemUrl(path, { hostname: this.hostname }) + '">' + anchorContent + '</a>';
    };

    /**
     * @method getContentLinkPrefix
     * @return {String}
     */
    ArticleRenderer.prototype.getContentLinkPrefix = function() {
        return '/article/';
    };

    ArticleRenderer.prototype.getContentLinkPrefixEn = function() {
        return '/article/';
    };

    /**
     * Retrieves the layout from the content object. Provides a mechanism to
     * allow for layout parameter to have any name.
     * @method getLayout
     * @param {Object} content
     * @return {String}
     */
    ArticleRenderer.prototype.getLayout = function(content) {
        return content.article_layout;
    };

    ArticleRenderer.prototype.getLayoutEn = function(content) {
        return content.article_layout_en;
    };

    ArticleRenderer.prototype.getThumbnail = function(content){
        return content.thumbnail;
    }

    /**
     * A workaround to allow this prototype to operate on articles and pages.
     * The layout parameter is not the same.  Until we introduce breaking
     * changes this will have to do.
     * @method setLayout
     * @param {Object} content
     * @param {String} layout
     */
    ArticleRenderer.prototype.setLayout = function(content, layout) {
        content.article_layout = layout;
    };

    ArticleRenderer.prototype.setLayoutEn = function(content, layout) {
        content.article_layout = layout;
    };

    /**
     * @method containsReadMoreFlag
     * @param {Object} content
     * @return {Boolean}
     */
    ArticleRenderer.prototype.containsReadMoreFlag = function(content) {
        if (!util.isObject(content)) {
            throw new Error('The content parameter must be an object');
        }
        return this.getLayout(content).indexOf(READ_MORE_FLAG) > -1;
    };

    ArticleRenderer.prototype.containsReadMoreFlagEn = function(content) {
        if (!util.isObject(content)) {
            throw new Error('The content parameter must be an object');
        }
        return this.getLayoutEn(content).indexOf(READ_MORE_FLAG) > -1;
    };

    return ArticleRenderer;
};
