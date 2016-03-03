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

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Loads a single article
     * @class ArticleViewController
     * @constructor
     * @extends BaseController
     */
    function PageEnViewController(){}
    util.inherits(PageEnViewController, pb.BaseController);

    /**
     * @method init
     * @param {Object} content
     * @param {Function} cb
     */
    PageEnViewController.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {
            if (util.isError(err)) {
                return cb(err);
            }

            //create the service
            self.service = new pb.PageServiceEn(self.getServiceContext());

            //create the loader context
            var context     = self.getServiceContext();
            context.service = self.service;
            self.contentViewLoader = new pb.ContentViewLoader(context);

            cb(null, true);
        };
        PageEnViewController.super_.prototype.init.apply(this, [context, init]);
    };

    /**
     * @method render
     * @param {Function} cb
     */
    PageEnViewController.prototype.render = function(cb) {
        var self    = this;
        var custUrl = this.pathVars.customUrl;

        //attempt to load object
        var opts = {
            render: true,
            where: this.getWhereClause(custUrl)
        };
        //console.log(opts.where);
        this.service.getSingle(opts, function(err, content) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (content == null) {
                return self.reqHandler.serve404();
            }
            //console.log(content);
            var options = {};
            self.contentViewLoader.render_en([content], options, function(err, html) {
                if (util.isError(err)) {
                    return cb(err);
                }

                var result = {
                    content: html
                };
                cb(result);
            });
        });
    };

    /**
     * Builds out the where clause for finding the article to render.  Because
     * MongoDB has an object ID represented by 12 characters we must account
     * for this condition by building a where clause with an "or" condition.
     * Otherwise we will only query on the url key
     * @method getWhereClause
     * @param {String} custUrl Represents the article's ID or its slug
     * @return {Object} An object representing the where clause to use in the
     * query to locate the article
     */
    PageEnViewController.prototype.getWhereClause = function(custUrl) {

        //put a check to look up by ID *FIRST*
        var conditions = [];
        if(pb.validation.isIdStr(custUrl, true)) {
            pb.DAO.loadByValues({url_en: custUrl}, 'page', {select: '_id'}, function(err, id){
                if(util.error){
                    return cb(err);
                }
                conditions.push(id);
            });
        }

        //put a check to look up by URL
        conditions.push({
            url_en: custUrl
        });

        //check for object ID as the custom URL
        var where;
        if (conditions.length > 1) {
            where = {
                $or: conditions
            };
        }
        else {
            where = conditions[0];
        }
        return where;
    };

    //exports
    return PageEnViewController;
};