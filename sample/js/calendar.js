(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
tui.util.defineNamespace('tui.component.Calendar', require('./src/js/calendar'));

},{"./src/js/calendar":2}],2:[function(require,module,exports){
/**
 * @fileoverview Calendar component(from Pug component)
 * @author NHN Ent. FE dev team. <dl_javascript@nhnent.com>
 * @dependency jquery ~1.8.3, ne-code-snippet ~1.0.2
 */

'use strict';
var utils = require('./utils');

var util = tui.util,
    CONSTANTS = {
        relativeMonthValueKey: 'relativeMonthValue',
        prevYear: 'prev-year',
        prevMonth: 'prev-month',
        nextYear: 'next-year',
        nextMonth: 'next-month',
        calendarHeader: null,
        calendarBody: null,
        calendarFooter: null,
        defaultClassPrefixRegExp: /calendar-/g,
        titleRegExp: /yyyy|yy|mm|m|M/g,
        titleYearRegExp: /yyyy|yy/g,
        titleMonthRegExp: /mm|m|M/g,
        todayRegExp: /yyyy|yy|mm|m|M|dd|d|D/g
    };

CONSTANTS.calendarHeader = [
    '<div class="calendar-header">',
    '<a href="#" class="rollover calendar-btn-' + CONSTANTS.prevYear + '">이전해</a>',
    '<a href="#" class="rollover calendar-btn-' + CONSTANTS.prevMonth + '">이전달</a>',
    '<strong class="calendar-title"></strong>',
    '<a href="#" class="rollover calendar-btn-' + CONSTANTS.nextMonth + '">다음달</a>',
    '<a href="#" class="rollover calendar-btn-' + CONSTANTS.nextYear + '">다음해</a>',
    '</div>'].join('');

CONSTANTS.calendarBody = [
    '<div class="calendar-body">',
        '<table>',
            '<thead>',
                '<tr>',
                   '<th class="calendar-sun">Su</th><th>Mo</th><th>Tu</th><th>We</th><th>Th</th><th>Fa</th><th class="calendar-sat">Sa</th>',
                '</tr>',
            '</thead>',
            '<tbody>',
                '<tr class="calendar-week">',
                    '<td class="calendar-date"></td>',
                    '<td class="calendar-date"></td>',
                    '<td class="calendar-date"></td>',
                    '<td class="calendar-date"></td>',
                    '<td class="calendar-date"></td>',
                    '<td class="calendar-date"></td>',
                    '<td class="calendar-date"></td>',
                '</tr>',
            '</tbody>',
        '</table>',
    '</div>'].join('');

CONSTANTS.calendarFooter = [
    '<div class="calendar-footer">',
        '<p>오늘 <em class="calendar-today"></em></p>',
    '</div>'].join('');


/**
 * Calendar component class
 * @constructor
 * @param {Object} [option] A options for initialize
 *     @param {HTMLElement} option.element A root element
 *     @param {string} [option.classPrefix="calendar-"] A prefix class for markup structure
 *     @param {number} [option.year=this year] A year for initialize
 *     @param {number} [option.month=this month] A month for initialize
 *     @param {string} [option.titleFormat="yyyy-mm"] A title format. This component find title element by className '[prefix]title'
 *     @param {string} [option.todayFormat = "yyyy Year mm Month dd Day (D)"] A today format. This component find today element by className '[prefix]today'
 *     @param {string} [option.yearTitleFormat = "yyyy"] A year title formant. This component find year title element by className '[prefix]year'
 *     @param {string} [option.monthTitleFormat = "m"] A month title format. This component find month title element by className이 '[prefix]month'
 *     @param {Array} [option.monthTitles = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]] A label of each month.
 *     @param {Array} [option.dayTitles = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]] A label for day. If you set the other option todayFormat 'D', you can use this name. 
 * @example
 * var calendar = new ne.component.Calendar({
 *                    element: '#layer',
 *                    classPrefix: "calendar-",
 *                    year: 1983,
 *                    month: 5,
 *                    titleFormat: "yyyy-mm", // title
 *                    todayFormat: "yyyy / mm / dd (D)" // today
 *                    yearTitleFormat: "yyyy", // year title
 *                    monthTitleFormat: "m", // month title
 *                    monthTitles: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"], 
 *                    dayTitles: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] // 요일들
 *             });
 **/
var Calendar = util.defineClass( /** @lends Calendar.prototype */ {
    init: function(option) {
        /**
         * Set options
         * option: {
         *     classPrefix: string,
         *     year: number
         *     month: number
         *     titleFormat: string,
         *     todayFormat: string,
         *     yearTitleFormat: string,
         *     monthTitleFormat: string,
         *     monthTitles: Array,
         *     dayTitles: Array,
         * }
         * @private
         */
        this._option = {};

        /**
         * A day that is shown
         * @type {{year: number, month: number}}
         */
        this._shownDate = {year: 0, month: 1, date: 1};

        /**======================================
         * jQuery - HTMLElement
         *======================================*/
        /**
         * =========Root Element=========
         * If options do not include element, this component jedge initialize element without options
         * @type {jQuery}
         * @private
         */
        this.$element = $(option.element || arguments[0]);

        /**
         * =========Header=========
         * @type {jQuery}
         */
        this.$header = null;

        /**
         * A tilte
         * @type {jQuery}
         */
        this.$title = null;

        /**
         * A year title
         * @type {jQuery}
         */
        this.$titleYear = null;

        /**
         * A month title
         * @type {jQuery}
         */
        this.$titleMonth = null;

        /**
         * =========Body=========
         * @type {jQuery}
         */
        this.$body = null;

        /**
         * A template of week
         * @type {jQuery}
         */
        this.$weekTemplate = null;

        /**
         * A week parent element 
         * @type {jQuery}
         */
        this.$weekAppendTarget = null;

        /**-------- footer --------*/
        this.$footer = null;

        /** Today */
        this.$today = null;

        /**
         * A date element
         * @type {jQuery}
         * @private
         */
        this._$dateElement = null;

        /**
         * A date wrapper element
         * @type {jQuery}
         * @private
         */
        this._$dateContainerElement = null;

        /**
         * =========Footer=========
         * @type {jQuery}
         */
        this.$footer = null;

        /**
         * Today element
         * @type {jQuery}
         */
        this.$today = null;

        /** Set default options */
        this._setDefault(option);
    },

    /**
     * Set defulat opitons
     * @param {Object} [option] A options to initialzie component
     * @private
     */
    _setDefault: function(option) {
        this._setOption(option);
        this._assignHTMLElements();
        this.draw(this._option.year, this._option.month, false);
    },

    /**
     * Save options
     * @param {Object} [option] A options to initialize component
     * @private
     */
    _setOption: function(option) {
        var instanceOption = this._option,
            today = utils.getDateHashTable();

        var defaultOption = {
            classPrefix: 'calendar-',
            year: today.year,
            month: today.month,
            titleFormat: 'yyyy-mm',
            todayFormat: 'yyyy/mm/dd (D)',
            yearTitleFormat: 'yyyy',
            monthTitleFormat: 'm',
            monthTitles: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
            dayTitles: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        };
        util.extend(instanceOption, defaultOption, option);
    },

    /**
     * Set element to filed
     * @private
     */
    _assignHTMLElements: function() {
        var classPrefix = this._option.classPrefix,
            $element = this.$element,
            classSelector = '.' + classPrefix;

        this._assignHeader($element, classSelector, classPrefix);
        this._assignBody($element, classSelector, classPrefix);
        this._assignFooter($element, classSelector, classPrefix);
    },

    /**
     * Register header element.
     * @param {jQuery} $element The root element of component
     * @param {string} classSelector A class selector
     * @param {string} classPrefix A prefix for class
     * @private
     */
    _assignHeader: function($element, classSelector, classPrefix) {
        var $header = $element.find(classSelector + 'header'),
            headerTemplate,
            defaultClassPrefixRegExp,
            key = CONSTANTS.relativeMonthValueKey,
            btnClassName = 'btn-';

        if (!$header.length) {
            headerTemplate = CONSTANTS.calendarHeader;
            defaultClassPrefixRegExp = CONSTANTS.defaultClassPrefixRegExp;

            $header = $(headerTemplate.replace(defaultClassPrefixRegExp, classPrefix));
            $element.append($header);
        }
        // button
        $header.find(classSelector + btnClassName + CONSTANTS.prevYear).data(key, -12);
        $header.find(classSelector + btnClassName + CONSTANTS.prevMonth).data(key, -1);
        $header.find(classSelector + btnClassName + CONSTANTS.nextYear).data(key, 12);
        $header.find(classSelector + btnClassName + CONSTANTS.nextMonth).data(key, 1);

        // title text
        this.$title = $header.find(classSelector + 'title');
        this.$titleYear = $header.find(classSelector + 'title-year');
        this.$titleMonth = $header.find(classSelector + 'title-month');
        this.$header = $header;
        this._attachEventToRolloverBtn();
    },

    /**
     * Register body element
     * @param {jQuery} $element The root elment of component
     * @param {string} classSelector A selector 
     * @param {string} classPrefix A prefix for class
     * @private
     */
    _assignBody: function($element, classSelector, classPrefix) {
        var $body = $element.find(classSelector + 'body'),
            $weekTemplate,
            bodyTemplate,
            defaultClassPrefixRegExp;

        if (!$body.length) {
            bodyTemplate = CONSTANTS.calendarBody;
            defaultClassPrefixRegExp = CONSTANTS.defaultClassPrefixRegExp;

            $body = $(bodyTemplate.replace(defaultClassPrefixRegExp, classPrefix));
            $element.append($body);
        }
        $weekTemplate = $body.find(classSelector + 'week');
        this.$weekTemplate = $weekTemplate.clone(true);
        this.$weekAppendTarget = $weekTemplate.parent();
        this.$body = $body;
    },

    /**
     * Register footer element
     * @param {jQuery} $element The root element of component
     * @param {string} classSelector A selector
     * @param {string} classPrefix A prefix for class
     * @private
     */
    _assignFooter: function($element, classSelector, classPrefix) {
        var $footer = $element.find(classSelector + 'footer'),
            footerTemplate,
            defaultClassPrefixRegExp;

        if (!$footer.length) {
            footerTemplate = CONSTANTS.calendarFooter;
            defaultClassPrefixRegExp = CONSTANTS.defaultClassPrefixRegExp;

            $footer = $(footerTemplate.replace(defaultClassPrefixRegExp, classPrefix));
            $element.append($footer);
        }
        this.$today = $footer.find(classSelector + 'today');
        this.$footer = $footer;
    },

    /**
     * Set navigation event
     * @private
     */
    _attachEventToRolloverBtn: function() {
        var btns = this.$header.find('.rollover');

        btns.on('click', util.bind(function() {
            var relativeMonthValue = $(event.target).data(CONSTANTS.relativeMonthValueKey);
            this.draw(0, relativeMonthValue, true);
            event.preventDefault();
        }, this));
    },

    /**
     * Get Hash data to drow calendar
     * @param {number} year A year
     * @param {number} month A month
     * @param {boolean} [isRelative]  Whether is related other value or not
     * @returns {{year: number, month: number}} A date hash
     * @private
     */
    _getDateForDrawing: function(year, month, isRelative) {
        var nDate = this.getDate(),
            relativeDate;

        nDate.date = 1;
        if (!util.isNumber(year) && !util.isNumber(month)) {
            return nDate;
        }

        if (isRelative) {
            relativeDate = utils.getRelativeDate(year, month, 0, nDate);
            nDate.year = relativeDate.year;
            nDate.month = relativeDate.month;
        } else {
            nDate.year = year || nDate.year;
            nDate.month = month || nDate.month;
        }

        return nDate;
    },

    /**
     * Judge to redraw calendar
     * @param {number} year A year
     * @param {number} month A month
     * @returns {boolean} reflow 
     * @private
     */
    _isNecessaryForDrawing: function(year, month) {
        var shownDate = this._shownDate;

        return (shownDate.year !== year || shownDate.month !== month);
    },

    /**
     * Draw calendar text
     * @param {{year: number, month: number}} dateForDrawing Tha hash that show up on calendar 
     * @private
     */
    _setCalendarText: function(dateForDrawing) {
        var year = dateForDrawing.year,
            month = dateForDrawing.month;

        this._setCalendarToday();
        this._setCalendarTitle(year, month);
    },

    /**
     * Draw dates by month.
     * @param {{year: number, month: number}} dateForDrawing A date to draw
     * @param {string} classPrefix A class prefix
     * @private
     */
    _drawDates: function(dateForDrawing, classPrefix) {
        var year = dateForDrawing.year,
            month = dateForDrawing.month,
            dayInWeek = 0,
            datePrevMonth = utils.getRelativeDate(0, -1, 0, dateForDrawing),
            dateNextMonth = utils.getRelativeDate(0, 1, 0, dateForDrawing),
            dates = [],
            firstDay = utils.getFirstDay(year, month),
            indexOfLastDate = this._fillDates(year, month, dates);

        util.forEach(dates, function(date, i) {
            var isPrevMonth = false,
                isNextMonth = false,
                $dateContainer = $(this._$dateContainerElement[i]),
                tempYear = year,
                tempMonth = month,
                eventData;

            if (i < firstDay) {
                isPrevMonth = true;
                $dateContainer.addClass(classPrefix + CONSTANTS.prevMonth);
                tempYear = datePrevMonth.year;
                tempMonth = datePrevMonth.month;
            } else if (i > indexOfLastDate) {
                isNextMonth = true;
                $dateContainer.addClass(classPrefix + CONSTANTS.nextMonth);
                tempYear = dateNextMonth.year;
                tempMonth = dateNextMonth.month;
            }

            // Weekend
            this._setWeekend(dayInWeek, $dateContainer, classPrefix);

            // Today
            if (this._isToday(tempYear, tempMonth, date)) {
                $dateContainer.addClass(classPrefix + 'today');
            }

            eventData = {
                $date: $(this._$dateElement.get(i)),
                $dateContainer: $dateContainer,
                year: tempYear,
                month: tempMonth,
                date: date,
                isPrevMonth: isPrevMonth,
                isNextMonth: isNextMonth,
                html: date
            };
            $(eventData.$date).html(eventData.html.toString());
            dayInWeek = (dayInWeek + 1) % 7;

            /**
             * Fire draw event when calendar draw each date.
             * @param {string} type A name of custom event
             * @param {boolean} isPrevMonth Whether the draw day is last month or not
             * @param {boolean} isNextMonth Wehter the draw day is next month or not
             * @param {jQuery} $date The element have date html
             * @param {jQuery} $dateContainer Child element that has className [prefix]week. It is possible this element equel elDate.
             * @param {number} date A draw date
             * @param {number} month A draw month
             * @param {number} year A draw year
             * @param {string} html A html string
             * @example
             * // draw custom even thandle
             * calendar.on('draw', function(drawEvent){ ... });
             **/
            this.fire('draw', eventData);
        }, this);
    },


    /**
     * Jedge the input date is today.
     * @param {number} year A year
     * @param {number} month A month
     * @param {number} date A date
     * @returns {boolean} 
     * @private
     */
    _isToday: function(year, month, date) {
        var today = utils.getDateHashTable();

        return (
            today.year === year &&
            today.month === month &&
            today.date === date
        );
    },

    /**
     * Make one week tempate.
     * @param {number} year  A year
     * @param {number} month A month
     * @private
     */
    _setWeeks: function(year, month) {
        var $elWeek,
            weeks = utils.getWeeks(year, month),
            i;
        for (i = 0; i < weeks; i += 1) {
            $elWeek = this.$weekTemplate.clone(true);
            $elWeek.appendTo(this.$weekAppendTarget);
            this._weekElements.push($elWeek);
        }
    },

    /**
     * Save draw dates to array
     * @param {string} year A draw year
     * @param {string} month A draw month
     * @param {Array} dates A draw date
     * @return {number} index of last date
     * @private
     */
    _fillDates: function(year, month, dates) {
        var firstDay = utils.getFirstDay(year, month),
            lastDay = utils.getLastDay(year, month),
            lastDate = utils.getLastDate(year, month),
            datePrevMonth = utils.getRelativeDate(0, -1, 0, {year: year, month: month, date: 1}),
            prevMonthLastDate = utils.getLastDate(datePrevMonth.year, datePrevMonth.month),
            indexOfLastDate,
            i;

        if (firstDay > 0) {
            for (i = prevMonthLastDate - firstDay; i < prevMonthLastDate; i += 1) {
                dates.push(i + 1);
            }
        }
        for (i = 1; i < lastDate + 1; i += 1) {
            dates.push(i);
        }
        indexOfLastDate = dates.length - 1;
        for (i = 1; i < 7 - lastDay; i += 1) {
            dates.push(i);
        }

        return indexOfLastDate;
    },

    /**
     * Set weekend
     * @param {number} day A date
     * @param {jQuery} $dateContainer A container element for date
     * @param {string} classPrefix A prefix of class
     * @private
     */
    _setWeekend: function(day, $dateContainer, classPrefix) {
        if (day === 0) {
            $dateContainer.addClass(classPrefix + 'sun');
        } else if (day === 6) {
            $dateContainer.addClass(classPrefix + 'sat');
        }
    },

    /**
     * Clear calendar
     * @private
     */
    _clear: function() {
        this._weekElements = [];
        this.$weekAppendTarget.empty();
    },

    /**
     * Draw title with format option.
     * @param {number} year A value of year (ex. 2008)
     * @param {(number|string)} month A month (1 ~ 12)
     * @private
     **/
    _setCalendarTitle: function(year, month) {
        var option = this._option,
            titleFormat = option.titleFormat,
            replaceMap,
            reg;

        month = this._prependLeadingZero(month);
        replaceMap = this._getReplaceMap(year, month);

        reg = CONSTANTS.titleRegExp;
        this._setDateTextInCalendar(this.$title, titleFormat, replaceMap, reg);

        reg = CONSTANTS.titleYearRegExp;
        this._setDateTextInCalendar(this.$titleYear, option.yearTitleFormat, replaceMap, reg);

        reg = CONSTANTS.titleMonthRegExp;
        this._setDateTextInCalendar(this.$titleMonth, option.monthTitleFormat, replaceMap, reg);
    },

    /**
     * Update title
     * @param {jQuery|HTMLElement} element A update element
     * @param {string} form A update form
     * @param {Object} map A object that has value matched regExp
     * @param {RegExp} reg A regExp to chagne form
     * @private
     */
    _setDateTextInCalendar: function(element, form, map, reg) {
        var title,
            $el = $(element);

        if (!$el.length) {
            return;
        }
        title = this._getConvertedTitle(form, map, reg);
        $el.text(title);
    },

    /**
     * Get map data for form
     * @param {string|number} year A year
     * @param {string|number} month A month
     * @param {string|number} [date] A day
     * @returns {Object} ReplaceMap
     * @private
     */
    _getReplaceMap: function(year, month, date) {
        var option = this._option,
            yearSub = (year.toString()).substr(2, 2),
            monthLabel = option.monthTitles[month - 1],
            labelKey = new Date(year, month - 1, date || 1).getDay(),
            dayLabel = option.dayTitles[labelKey];

        return {
            yyyy: year,
            yy: yearSub,
            mm: month,
            m: Number(month),
            M: monthLabel,
            dd: date,
            d: Number(date),
            D: dayLabel
        };
    },

    /**
     * Chage text and return.
     * @param {string} str A text to chagne
     * @param {Object} map A chagne key, value set
     * @param {RegExp} reg A regExp to chagne 
     * @returns {string}
     * @private
     */
    _getConvertedTitle: function(str, map, reg) {
        str = str.replace(reg, function(matchedString) {
            return map[matchedString] || '';
        });
        return str;
    },

    /**
     * Set today
     * @private
     */
    _setCalendarToday: function() {
        var $today = this.$today,
            todayFormat,
            today,
            year,
            month,
            date,
            replaceMap,
            reg;

        if (!$today.length) {
            return;
        }

        today = utils.getDateHashTable();
        year = today.year;
        month = this._prependLeadingZero(today.month);
        date = this._prependLeadingZero(today.date);
        todayFormat = this._option.todayFormat;
        replaceMap = this._getReplaceMap(year, month, date);
        reg = CONSTANTS.todayRegExp;
        this._setDateTextInCalendar($today, todayFormat, replaceMap, reg);
    },

    /**
     * Chagne number 0~9 to '00~09'
     * @param {number} number number
     * @returns {string}
     * @private
     * @example
     *  this._prependLeadingZero(0); //  '00'
     *  this._prependLeadingZero(9); //  '09'
     *  this._prependLeadingZero(12); //  '12'
     */
    _prependLeadingZero: function(number) {
        var prefix = '';

        if (number < 10) {
            prefix = '0';
        }
        return prefix + number;
    },

    /**
     * Draw calendar
     * @param {number} [year] A year (ex. 2008)
     * @param {number} [month] A month (1 ~ 12)
     * @param {Boolean} [isRelative]  A year and month is related
     * @example
     * calendar.draw(); // Draw with now date.
     * calendar.draw(2008, 12); // Draw 2008/12
     * calendar.draw(null, 12); // Draw current year/12
     * calendar.draw(2010, null); // Draw 2010/current month
     * calendar.draw(0, 1, true); // Draw next month
     * calendar.draw(-1, null, true); // Draw prev year
     **/
    draw: function(year, month, isRelative) {
        var dateForDrawing = this._getDateForDrawing(year, month, isRelative),
            isReadyForDrawing = this.invoke('beforeDraw', dateForDrawing),
            classPrefix;

        /**===============
         * beforeDraw
         =================*/
        if (!isReadyForDrawing) {
            return;
        }

        /**===============
         * draw
         =================*/
        year = dateForDrawing.year;
        month = dateForDrawing.month;

        classPrefix = this._option.classPrefix;
        this._clear();
        this._setCalendarText(dateForDrawing);

        // weeks
        this._setWeeks(year, month);
        this._$dateElement = $('.' + classPrefix + 'date', this.$weekAppendTarget);
        this._$dateContainerElement = $('.' + classPrefix + 'week > *', this.$weekAppendTarget);

        // dates
        this.setDate(year, month);
        this._drawDates(dateForDrawing, classPrefix);
        this.$element.show();

        /**===============
         * afterDraw
         ================*/
        this.fire('afterDraw', dateForDrawing);
    },

    /**
     * Return current year and month(just shown).
     * @returns {{year: number, month: number}}
     */
    getDate: function() {
        return {
            year: this._shownDate.year,
            month: this._shownDate.month
        };
    },

    /**
     * Set date
     * @param {number} [year] A year (ex. 2008)
     * @param {number} [month] A month (1 ~ 12)
     **/
    setDate: function(year, month) {
        var date = this._shownDate;
        date.year = util.isNumber(year) ? year : date.year;
        date.month = util.isNumber(month) ? month : date.month;
    }
});

util.CustomEvents.mixin(Calendar);
module.exports = Calendar;

},{"./utils":3}],3:[function(require,module,exports){
/**
 * @fileoverview Utils for calendar component
 * @author NHN Net. FE dev team. <dl_javascript@nhnent.com>
 * @dependency ne-code-snippet ~1.0.2
 */

'use strict';

/**
 * Utils of calendar
 * @namespace utils
 */
var utils = {
    /**
     * Return date hash by parameter.
     *  if there are 3 parameter, the parameter is corgnized Date object
     *  if there are no parameter, return today's hash date
     * @function getDateHashTable
     * @memberof utils
     * @param {Date|number} [year] A date instance or year
     * @param {number} [month] A month
     * @param {number} [date] A date
     * @returns {{year: *, month: *, date: *}} 
     */
    getDateHashTable: function(year, month, date) {
        var nDate;

        if (arguments.length < 3) {
            nDate = arguments[0] || new Date();

            year = nDate.getFullYear();
            month = nDate.getMonth() + 1;
            date = nDate.getDate();
        }

        return {
            year: year,
            month: month,
            date: date
        };
    },

    /**
     * Return today that saved on component or create new date.
     * @function getToday
     * @returns {{year: *, month: *, date: *}}
     * @memberof utils
     */
    getToday: function() {
       return utils.getDateHashTable();
    },

    /**
     * Get weeks count by paramenter
     * @function getWeeks
     * @param {number} year A year
     * @param {number} month A month
     * @return {number} 주 (4~6)
     * @memberof utils
     **/
    getWeeks: function(year, month) {
        var firstDay = this.getFirstDay(year, month),
            lastDate = this.getLastDate(year, month);

        return Math.ceil((firstDay + lastDate) / 7);
    },

    /**
     * Get unix time from date hash
     * @function getTime
     * @param {Object} date A date hash
     * @param {number} date.year A year
     * @param {number} date.month A month
     * @param {number} date.date A date
     * @return {number} 
     * @memberof utils
     * @example
     * utils.getTime({year:2010, month:5, date:12}); // 1273590000000
     **/
    getTime: function(date) {
        return this.getDateObject(date).getTime();
    },

    /**
     * Get which day is first by parameters that include year and month information.
     * @function getFirstDay
     * @param {number} year A year
     * @param {number} month A month
     * @return {number} (0~6)
     * @memberof utils
     **/
    getFirstDay: function(year, month) {
        return new Date(year, month - 1, 1).getDay();
    },

    /**
     * Get which day is last by parameters that include year and month information.
     * @function getLastDay
     * @param {number} year A year
     * @param {number} month A month
     * @return {number} (0~6)
     * @memberof utils
     **/
    getLastDay: function(year, month) {
        return new Date(year, month, 0).getDay();
    },

    /**
     * Get last date by parameters that include year and month information.
     * @function
     * @param {number} year A year
     * @param {number} month A month
     * @return {number} (1~31)
     * @memberof utils
     **/
    getLastDate: function(year, month) {
        return new Date(year, month, 0).getDate();
    },

    /**
     * Get date instance.
     * @function getDateObject
     * @param {Object} date A date hash
     * @return {Date} Date  
     * @memberof utils
     * @example
     *  utils.getDateObject({year:2010, month:5, date:12});
     *  utils.getDateObject(2010, 5, 12); //year,month,date
     **/
    getDateObject: function(date) {
        if (arguments.length === 3) {
            return new Date(arguments[0], arguments[1] - 1, arguments[2]);
        }
        return new Date(date.year, date.month - 1, date.date);
    },

    /**
     * Get related date hash with parameters that include date information.
     * @function getRelativeDate
     * @param {number} year A related value for year(you can use +/-)
     * @param {number} month A related value for month (you can use +/-)
     * @param {number} date A related value for day (you can use +/-)
     * @param {Object} dateObj standard date hash
     * @return {Object} dateObj 
     * @memberof utils
     * @example
     *  utils.getRelativeDate(1, 0, 0, {year:2000, month:1, date:1}); // {year:2001, month:1, date:1}
     *  utils.getRelativeDate(0, 0, -1, {year:2010, month:1, date:1}); // {year:2009, month:12, date:31}
     **/
    getRelativeDate: function(year, month, date, dateObj) {
        var nYear = (dateObj.year + year),
            nMonth = (dateObj.month + month - 1),
            nDate = (dateObj.date + date),
            nDateObj = new Date(nYear, nMonth, nDate);

        return utils.getDateHashTable(nDateObj);
    }
};

module.exports = utils;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jYWxlbmRhci5qcyIsInNyYy9qcy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidHVpLnV0aWwuZGVmaW5lTmFtZXNwYWNlKCd0dWkuY29tcG9uZW50LkNhbGVuZGFyJywgcmVxdWlyZSgnLi9zcmMvanMvY2FsZW5kYXInKSk7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ2FsZW5kYXIgY29tcG9uZW50KGZyb20gUHVnIGNvbXBvbmVudClcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgZGV2IHRlYW0uIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKiBAZGVwZW5kZW5jeSBqcXVlcnkgfjEuOC4zLCBuZS1jb2RlLXNuaXBwZXQgfjEuMC4yXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgdXRpbCA9IHR1aS51dGlsLFxuICAgIENPTlNUQU5UUyA9IHtcbiAgICAgICAgcmVsYXRpdmVNb250aFZhbHVlS2V5OiAncmVsYXRpdmVNb250aFZhbHVlJyxcbiAgICAgICAgcHJldlllYXI6ICdwcmV2LXllYXInLFxuICAgICAgICBwcmV2TW9udGg6ICdwcmV2LW1vbnRoJyxcbiAgICAgICAgbmV4dFllYXI6ICduZXh0LXllYXInLFxuICAgICAgICBuZXh0TW9udGg6ICduZXh0LW1vbnRoJyxcbiAgICAgICAgY2FsZW5kYXJIZWFkZXI6IG51bGwsXG4gICAgICAgIGNhbGVuZGFyQm9keTogbnVsbCxcbiAgICAgICAgY2FsZW5kYXJGb290ZXI6IG51bGwsXG4gICAgICAgIGRlZmF1bHRDbGFzc1ByZWZpeFJlZ0V4cDogL2NhbGVuZGFyLS9nLFxuICAgICAgICB0aXRsZVJlZ0V4cDogL3l5eXl8eXl8bW18bXxNL2csXG4gICAgICAgIHRpdGxlWWVhclJlZ0V4cDogL3l5eXl8eXkvZyxcbiAgICAgICAgdGl0bGVNb250aFJlZ0V4cDogL21tfG18TS9nLFxuICAgICAgICB0b2RheVJlZ0V4cDogL3l5eXl8eXl8bW18bXxNfGRkfGR8RC9nXG4gICAgfTtcblxuQ09OU1RBTlRTLmNhbGVuZGFySGVhZGVyID0gW1xuICAgICc8ZGl2IGNsYXNzPVwiY2FsZW5kYXItaGVhZGVyXCI+JyxcbiAgICAnPGEgaHJlZj1cIiNcIiBjbGFzcz1cInJvbGxvdmVyIGNhbGVuZGFyLWJ0bi0nICsgQ09OU1RBTlRTLnByZXZZZWFyICsgJ1wiPuydtOyghO2VtDwvYT4nLFxuICAgICc8YSBocmVmPVwiI1wiIGNsYXNzPVwicm9sbG92ZXIgY2FsZW5kYXItYnRuLScgKyBDT05TVEFOVFMucHJldk1vbnRoICsgJ1wiPuydtOyghOuLrDwvYT4nLFxuICAgICc8c3Ryb25nIGNsYXNzPVwiY2FsZW5kYXItdGl0bGVcIj48L3N0cm9uZz4nLFxuICAgICc8YSBocmVmPVwiI1wiIGNsYXNzPVwicm9sbG92ZXIgY2FsZW5kYXItYnRuLScgKyBDT05TVEFOVFMubmV4dE1vbnRoICsgJ1wiPuuLpOydjOuLrDwvYT4nLFxuICAgICc8YSBocmVmPVwiI1wiIGNsYXNzPVwicm9sbG92ZXIgY2FsZW5kYXItYnRuLScgKyBDT05TVEFOVFMubmV4dFllYXIgKyAnXCI+64uk7J2M7ZW0PC9hPicsXG4gICAgJzwvZGl2PiddLmpvaW4oJycpO1xuXG5DT05TVEFOVFMuY2FsZW5kYXJCb2R5ID0gW1xuICAgICc8ZGl2IGNsYXNzPVwiY2FsZW5kYXItYm9keVwiPicsXG4gICAgICAgICc8dGFibGU+JyxcbiAgICAgICAgICAgICc8dGhlYWQ+JyxcbiAgICAgICAgICAgICAgICAnPHRyPicsXG4gICAgICAgICAgICAgICAgICAgJzx0aCBjbGFzcz1cImNhbGVuZGFyLXN1blwiPlN1PC90aD48dGg+TW88L3RoPjx0aD5UdTwvdGg+PHRoPldlPC90aD48dGg+VGg8L3RoPjx0aD5GYTwvdGg+PHRoIGNsYXNzPVwiY2FsZW5kYXItc2F0XCI+U2E8L3RoPicsXG4gICAgICAgICAgICAgICAgJzwvdHI+JyxcbiAgICAgICAgICAgICc8L3RoZWFkPicsXG4gICAgICAgICAgICAnPHRib2R5PicsXG4gICAgICAgICAgICAgICAgJzx0ciBjbGFzcz1cImNhbGVuZGFyLXdlZWtcIj4nLFxuICAgICAgICAgICAgICAgICAgICAnPHRkIGNsYXNzPVwiY2FsZW5kYXItZGF0ZVwiPjwvdGQ+JyxcbiAgICAgICAgICAgICAgICAgICAgJzx0ZCBjbGFzcz1cImNhbGVuZGFyLWRhdGVcIj48L3RkPicsXG4gICAgICAgICAgICAgICAgICAgICc8dGQgY2xhc3M9XCJjYWxlbmRhci1kYXRlXCI+PC90ZD4nLFxuICAgICAgICAgICAgICAgICAgICAnPHRkIGNsYXNzPVwiY2FsZW5kYXItZGF0ZVwiPjwvdGQ+JyxcbiAgICAgICAgICAgICAgICAgICAgJzx0ZCBjbGFzcz1cImNhbGVuZGFyLWRhdGVcIj48L3RkPicsXG4gICAgICAgICAgICAgICAgICAgICc8dGQgY2xhc3M9XCJjYWxlbmRhci1kYXRlXCI+PC90ZD4nLFxuICAgICAgICAgICAgICAgICAgICAnPHRkIGNsYXNzPVwiY2FsZW5kYXItZGF0ZVwiPjwvdGQ+JyxcbiAgICAgICAgICAgICAgICAnPC90cj4nLFxuICAgICAgICAgICAgJzwvdGJvZHk+JyxcbiAgICAgICAgJzwvdGFibGU+JyxcbiAgICAnPC9kaXY+J10uam9pbignJyk7XG5cbkNPTlNUQU5UUy5jYWxlbmRhckZvb3RlciA9IFtcbiAgICAnPGRpdiBjbGFzcz1cImNhbGVuZGFyLWZvb3RlclwiPicsXG4gICAgICAgICc8cD7smKTripggPGVtIGNsYXNzPVwiY2FsZW5kYXItdG9kYXlcIj48L2VtPjwvcD4nLFxuICAgICc8L2Rpdj4nXS5qb2luKCcnKTtcblxuXG4vKipcbiAqIENhbGVuZGFyIGNvbXBvbmVudCBjbGFzc1xuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbl0gQSBvcHRpb25zIGZvciBpbml0aWFsaXplXG4gKiAgICAgQHBhcmFtIHtIVE1MRWxlbWVudH0gb3B0aW9uLmVsZW1lbnQgQSByb290IGVsZW1lbnRcbiAqICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbi5jbGFzc1ByZWZpeD1cImNhbGVuZGFyLVwiXSBBIHByZWZpeCBjbGFzcyBmb3IgbWFya3VwIHN0cnVjdHVyZVxuICogICAgIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9uLnllYXI9dGhpcyB5ZWFyXSBBIHllYXIgZm9yIGluaXRpYWxpemVcbiAqICAgICBAcGFyYW0ge251bWJlcn0gW29wdGlvbi5tb250aD10aGlzIG1vbnRoXSBBIG1vbnRoIGZvciBpbml0aWFsaXplXG4gKiAgICAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb24udGl0bGVGb3JtYXQ9XCJ5eXl5LW1tXCJdIEEgdGl0bGUgZm9ybWF0LiBUaGlzIGNvbXBvbmVudCBmaW5kIHRpdGxlIGVsZW1lbnQgYnkgY2xhc3NOYW1lICdbcHJlZml4XXRpdGxlJ1xuICogICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9uLnRvZGF5Rm9ybWF0ID0gXCJ5eXl5IFllYXIgbW0gTW9udGggZGQgRGF5IChEKVwiXSBBIHRvZGF5IGZvcm1hdC4gVGhpcyBjb21wb25lbnQgZmluZCB0b2RheSBlbGVtZW50IGJ5IGNsYXNzTmFtZSAnW3ByZWZpeF10b2RheSdcbiAqICAgICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbi55ZWFyVGl0bGVGb3JtYXQgPSBcInl5eXlcIl0gQSB5ZWFyIHRpdGxlIGZvcm1hbnQuIFRoaXMgY29tcG9uZW50IGZpbmQgeWVhciB0aXRsZSBlbGVtZW50IGJ5IGNsYXNzTmFtZSAnW3ByZWZpeF15ZWFyJ1xuICogICAgIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9uLm1vbnRoVGl0bGVGb3JtYXQgPSBcIm1cIl0gQSBtb250aCB0aXRsZSBmb3JtYXQuIFRoaXMgY29tcG9uZW50IGZpbmQgbW9udGggdGl0bGUgZWxlbWVudCBieSBjbGFzc05hbWXsnbQgJ1twcmVmaXhdbW9udGgnXG4gKiAgICAgQHBhcmFtIHtBcnJheX0gW29wdGlvbi5tb250aFRpdGxlcyA9IFtcIkpBTlwiLFwiRkVCXCIsXCJNQVJcIixcIkFQUlwiLFwiTUFZXCIsXCJKVU5cIixcIkpVTFwiLFwiQVVHXCIsXCJTRVBcIixcIk9DVFwiLFwiTk9WXCIsXCJERUNcIl1dIEEgbGFiZWwgb2YgZWFjaCBtb250aC5cbiAqICAgICBAcGFyYW0ge0FycmF5fSBbb3B0aW9uLmRheVRpdGxlcyA9IFtcIlN1blwiLFwiTW9uXCIsXCJUdWVcIixcIldlZFwiLFwiVGh1XCIsXCJGcmlcIixcIlNhdFwiXV0gQSBsYWJlbCBmb3IgZGF5LiBJZiB5b3Ugc2V0IHRoZSBvdGhlciBvcHRpb24gdG9kYXlGb3JtYXQgJ0QnLCB5b3UgY2FuIHVzZSB0aGlzIG5hbWUuIFxuICogQGV4YW1wbGVcbiAqIHZhciBjYWxlbmRhciA9IG5ldyBuZS5jb21wb25lbnQuQ2FsZW5kYXIoe1xuICogICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICcjbGF5ZXInLFxuICogICAgICAgICAgICAgICAgICAgIGNsYXNzUHJlZml4OiBcImNhbGVuZGFyLVwiLFxuICogICAgICAgICAgICAgICAgICAgIHllYXI6IDE5ODMsXG4gKiAgICAgICAgICAgICAgICAgICAgbW9udGg6IDUsXG4gKiAgICAgICAgICAgICAgICAgICAgdGl0bGVGb3JtYXQ6IFwieXl5eS1tbVwiLCAvLyB0aXRsZVxuICogICAgICAgICAgICAgICAgICAgIHRvZGF5Rm9ybWF0OiBcInl5eXkgLyBtbSAvIGRkIChEKVwiIC8vIHRvZGF5XG4gKiAgICAgICAgICAgICAgICAgICAgeWVhclRpdGxlRm9ybWF0OiBcInl5eXlcIiwgLy8geWVhciB0aXRsZVxuICogICAgICAgICAgICAgICAgICAgIG1vbnRoVGl0bGVGb3JtYXQ6IFwibVwiLCAvLyBtb250aCB0aXRsZVxuICogICAgICAgICAgICAgICAgICAgIG1vbnRoVGl0bGVzOiBbXCJKQU5cIiwgXCJGRUJcIiwgXCJNQVJcIiwgXCJBUFJcIiwgXCJNQVlcIiwgXCJKVU5cIiwgXCJKVUxcIiwgXCJBVUdcIiwgXCJTRVBcIiwgXCJPQ1RcIiwgXCJOT1ZcIiwgXCJERUNcIl0sIFxuICogICAgICAgICAgICAgICAgICAgIGRheVRpdGxlczogWydzdW4nLCAnbW9uJywgJ3R1ZScsICd3ZWQnLCAndGh1JywgJ2ZyaScsICdzYXQnXSAvLyDsmpTsnbzrk6RcbiAqICAgICAgICAgICAgIH0pO1xuICoqL1xudmFyIENhbGVuZGFyID0gdXRpbC5kZWZpbmVDbGFzcyggLyoqIEBsZW5kcyBDYWxlbmRhci5wcm90b3R5cGUgKi8ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbikge1xuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IG9wdGlvbnNcbiAgICAgICAgICogb3B0aW9uOiB7XG4gICAgICAgICAqICAgICBjbGFzc1ByZWZpeDogc3RyaW5nLFxuICAgICAgICAgKiAgICAgeWVhcjogbnVtYmVyXG4gICAgICAgICAqICAgICBtb250aDogbnVtYmVyXG4gICAgICAgICAqICAgICB0aXRsZUZvcm1hdDogc3RyaW5nLFxuICAgICAgICAgKiAgICAgdG9kYXlGb3JtYXQ6IHN0cmluZyxcbiAgICAgICAgICogICAgIHllYXJUaXRsZUZvcm1hdDogc3RyaW5nLFxuICAgICAgICAgKiAgICAgbW9udGhUaXRsZUZvcm1hdDogc3RyaW5nLFxuICAgICAgICAgKiAgICAgbW9udGhUaXRsZXM6IEFycmF5LFxuICAgICAgICAgKiAgICAgZGF5VGl0bGVzOiBBcnJheSxcbiAgICAgICAgICogfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb3B0aW9uID0ge307XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEEgZGF5IHRoYXQgaXMgc2hvd25cbiAgICAgICAgICogQHR5cGUge3t5ZWFyOiBudW1iZXIsIG1vbnRoOiBudW1iZXJ9fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fc2hvd25EYXRlID0ge3llYXI6IDAsIG1vbnRoOiAxLCBkYXRlOiAxfTtcblxuICAgICAgICAvKio9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAgKiBqUXVlcnkgLSBIVE1MRWxlbWVudFxuICAgICAgICAgKj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ki9cbiAgICAgICAgLyoqXG4gICAgICAgICAqID09PT09PT09PVJvb3QgRWxlbWVudD09PT09PT09PVxuICAgICAgICAgKiBJZiBvcHRpb25zIGRvIG5vdCBpbmNsdWRlIGVsZW1lbnQsIHRoaXMgY29tcG9uZW50IGplZGdlIGluaXRpYWxpemUgZWxlbWVudCB3aXRob3V0IG9wdGlvbnNcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGVsZW1lbnQgPSAkKG9wdGlvbi5lbGVtZW50IHx8IGFyZ3VtZW50c1swXSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqID09PT09PT09PUhlYWRlcj09PT09PT09PVxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kaGVhZGVyID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQSB0aWx0ZVxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kdGl0bGUgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBIHllYXIgdGl0bGVcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJHRpdGxlWWVhciA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEEgbW9udGggdGl0bGVcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJHRpdGxlTW9udGggPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiA9PT09PT09PT1Cb2R5PT09PT09PT09XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRib2R5ID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQSB0ZW1wbGF0ZSBvZiB3ZWVrXG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiR3ZWVrVGVtcGxhdGUgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBIHdlZWsgcGFyZW50IGVsZW1lbnQgXG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiR3ZWVrQXBwZW5kVGFyZ2V0ID0gbnVsbDtcblxuICAgICAgICAvKiotLS0tLS0tLSBmb290ZXIgLS0tLS0tLS0qL1xuICAgICAgICB0aGlzLiRmb290ZXIgPSBudWxsO1xuXG4gICAgICAgIC8qKiBUb2RheSAqL1xuICAgICAgICB0aGlzLiR0b2RheSA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEEgZGF0ZSBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl8kZGF0ZUVsZW1lbnQgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBIGRhdGUgd3JhcHBlciBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl8kZGF0ZUNvbnRhaW5lckVsZW1lbnQgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiA9PT09PT09PT1Gb290ZXI9PT09PT09PT1cbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGZvb3RlciA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRvZGF5IGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJHRvZGF5ID0gbnVsbDtcblxuICAgICAgICAvKiogU2V0IGRlZmF1bHQgb3B0aW9ucyAqL1xuICAgICAgICB0aGlzLl9zZXREZWZhdWx0KG9wdGlvbik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBkZWZ1bGF0IG9waXRvbnNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbl0gQSBvcHRpb25zIHRvIGluaXRpYWx6aWUgY29tcG9uZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0RGVmYXVsdDogZnVuY3Rpb24ob3B0aW9uKSB7XG4gICAgICAgIHRoaXMuX3NldE9wdGlvbihvcHRpb24pO1xuICAgICAgICB0aGlzLl9hc3NpZ25IVE1MRWxlbWVudHMoKTtcbiAgICAgICAgdGhpcy5kcmF3KHRoaXMuX29wdGlvbi55ZWFyLCB0aGlzLl9vcHRpb24ubW9udGgsIGZhbHNlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2F2ZSBvcHRpb25zXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25dIEEgb3B0aW9ucyB0byBpbml0aWFsaXplIGNvbXBvbmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldE9wdGlvbjogZnVuY3Rpb24ob3B0aW9uKSB7XG4gICAgICAgIHZhciBpbnN0YW5jZU9wdGlvbiA9IHRoaXMuX29wdGlvbixcbiAgICAgICAgICAgIHRvZGF5ID0gdXRpbHMuZ2V0RGF0ZUhhc2hUYWJsZSgpO1xuXG4gICAgICAgIHZhciBkZWZhdWx0T3B0aW9uID0ge1xuICAgICAgICAgICAgY2xhc3NQcmVmaXg6ICdjYWxlbmRhci0nLFxuICAgICAgICAgICAgeWVhcjogdG9kYXkueWVhcixcbiAgICAgICAgICAgIG1vbnRoOiB0b2RheS5tb250aCxcbiAgICAgICAgICAgIHRpdGxlRm9ybWF0OiAneXl5eS1tbScsXG4gICAgICAgICAgICB0b2RheUZvcm1hdDogJ3l5eXkvbW0vZGQgKEQpJyxcbiAgICAgICAgICAgIHllYXJUaXRsZUZvcm1hdDogJ3l5eXknLFxuICAgICAgICAgICAgbW9udGhUaXRsZUZvcm1hdDogJ20nLFxuICAgICAgICAgICAgbW9udGhUaXRsZXM6IFsnSkFOJywgJ0ZFQicsICdNQVInLCAnQVBSJywgJ01BWScsICdKVU4nLCAnSlVMJywgJ0FVRycsICdTRVAnLCAnT0NUJywgJ05PVicsICdERUMnXSxcbiAgICAgICAgICAgIGRheVRpdGxlczogWydTdW4nLCAnTW9uJywgJ1R1ZScsICdXZWQnLCAnVGh1JywgJ0ZyaScsICdTYXQnXVxuICAgICAgICB9O1xuICAgICAgICB1dGlsLmV4dGVuZChpbnN0YW5jZU9wdGlvbiwgZGVmYXVsdE9wdGlvbiwgb3B0aW9uKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGVsZW1lbnQgdG8gZmlsZWRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hc3NpZ25IVE1MRWxlbWVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY2xhc3NQcmVmaXggPSB0aGlzLl9vcHRpb24uY2xhc3NQcmVmaXgsXG4gICAgICAgICAgICAkZWxlbWVudCA9IHRoaXMuJGVsZW1lbnQsXG4gICAgICAgICAgICBjbGFzc1NlbGVjdG9yID0gJy4nICsgY2xhc3NQcmVmaXg7XG5cbiAgICAgICAgdGhpcy5fYXNzaWduSGVhZGVyKCRlbGVtZW50LCBjbGFzc1NlbGVjdG9yLCBjbGFzc1ByZWZpeCk7XG4gICAgICAgIHRoaXMuX2Fzc2lnbkJvZHkoJGVsZW1lbnQsIGNsYXNzU2VsZWN0b3IsIGNsYXNzUHJlZml4KTtcbiAgICAgICAgdGhpcy5fYXNzaWduRm9vdGVyKCRlbGVtZW50LCBjbGFzc1NlbGVjdG9yLCBjbGFzc1ByZWZpeCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIGhlYWRlciBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbWVudCBUaGUgcm9vdCBlbGVtZW50IG9mIGNvbXBvbmVudFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc1NlbGVjdG9yIEEgY2xhc3Mgc2VsZWN0b3JcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NQcmVmaXggQSBwcmVmaXggZm9yIGNsYXNzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYXNzaWduSGVhZGVyOiBmdW5jdGlvbigkZWxlbWVudCwgY2xhc3NTZWxlY3RvciwgY2xhc3NQcmVmaXgpIHtcbiAgICAgICAgdmFyICRoZWFkZXIgPSAkZWxlbWVudC5maW5kKGNsYXNzU2VsZWN0b3IgKyAnaGVhZGVyJyksXG4gICAgICAgICAgICBoZWFkZXJUZW1wbGF0ZSxcbiAgICAgICAgICAgIGRlZmF1bHRDbGFzc1ByZWZpeFJlZ0V4cCxcbiAgICAgICAgICAgIGtleSA9IENPTlNUQU5UUy5yZWxhdGl2ZU1vbnRoVmFsdWVLZXksXG4gICAgICAgICAgICBidG5DbGFzc05hbWUgPSAnYnRuLSc7XG5cbiAgICAgICAgaWYgKCEkaGVhZGVyLmxlbmd0aCkge1xuICAgICAgICAgICAgaGVhZGVyVGVtcGxhdGUgPSBDT05TVEFOVFMuY2FsZW5kYXJIZWFkZXI7XG4gICAgICAgICAgICBkZWZhdWx0Q2xhc3NQcmVmaXhSZWdFeHAgPSBDT05TVEFOVFMuZGVmYXVsdENsYXNzUHJlZml4UmVnRXhwO1xuXG4gICAgICAgICAgICAkaGVhZGVyID0gJChoZWFkZXJUZW1wbGF0ZS5yZXBsYWNlKGRlZmF1bHRDbGFzc1ByZWZpeFJlZ0V4cCwgY2xhc3NQcmVmaXgpKTtcbiAgICAgICAgICAgICRlbGVtZW50LmFwcGVuZCgkaGVhZGVyKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBidXR0b25cbiAgICAgICAgJGhlYWRlci5maW5kKGNsYXNzU2VsZWN0b3IgKyBidG5DbGFzc05hbWUgKyBDT05TVEFOVFMucHJldlllYXIpLmRhdGEoa2V5LCAtMTIpO1xuICAgICAgICAkaGVhZGVyLmZpbmQoY2xhc3NTZWxlY3RvciArIGJ0bkNsYXNzTmFtZSArIENPTlNUQU5UUy5wcmV2TW9udGgpLmRhdGEoa2V5LCAtMSk7XG4gICAgICAgICRoZWFkZXIuZmluZChjbGFzc1NlbGVjdG9yICsgYnRuQ2xhc3NOYW1lICsgQ09OU1RBTlRTLm5leHRZZWFyKS5kYXRhKGtleSwgMTIpO1xuICAgICAgICAkaGVhZGVyLmZpbmQoY2xhc3NTZWxlY3RvciArIGJ0bkNsYXNzTmFtZSArIENPTlNUQU5UUy5uZXh0TW9udGgpLmRhdGEoa2V5LCAxKTtcblxuICAgICAgICAvLyB0aXRsZSB0ZXh0XG4gICAgICAgIHRoaXMuJHRpdGxlID0gJGhlYWRlci5maW5kKGNsYXNzU2VsZWN0b3IgKyAndGl0bGUnKTtcbiAgICAgICAgdGhpcy4kdGl0bGVZZWFyID0gJGhlYWRlci5maW5kKGNsYXNzU2VsZWN0b3IgKyAndGl0bGUteWVhcicpO1xuICAgICAgICB0aGlzLiR0aXRsZU1vbnRoID0gJGhlYWRlci5maW5kKGNsYXNzU2VsZWN0b3IgKyAndGl0bGUtbW9udGgnKTtcbiAgICAgICAgdGhpcy4kaGVhZGVyID0gJGhlYWRlcjtcbiAgICAgICAgdGhpcy5fYXR0YWNoRXZlbnRUb1JvbGxvdmVyQnRuKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIGJvZHkgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbWVudCBUaGUgcm9vdCBlbG1lbnQgb2YgY29tcG9uZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzU2VsZWN0b3IgQSBzZWxlY3RvciBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NQcmVmaXggQSBwcmVmaXggZm9yIGNsYXNzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYXNzaWduQm9keTogZnVuY3Rpb24oJGVsZW1lbnQsIGNsYXNzU2VsZWN0b3IsIGNsYXNzUHJlZml4KSB7XG4gICAgICAgIHZhciAkYm9keSA9ICRlbGVtZW50LmZpbmQoY2xhc3NTZWxlY3RvciArICdib2R5JyksXG4gICAgICAgICAgICAkd2Vla1RlbXBsYXRlLFxuICAgICAgICAgICAgYm9keVRlbXBsYXRlLFxuICAgICAgICAgICAgZGVmYXVsdENsYXNzUHJlZml4UmVnRXhwO1xuXG4gICAgICAgIGlmICghJGJvZHkubGVuZ3RoKSB7XG4gICAgICAgICAgICBib2R5VGVtcGxhdGUgPSBDT05TVEFOVFMuY2FsZW5kYXJCb2R5O1xuICAgICAgICAgICAgZGVmYXVsdENsYXNzUHJlZml4UmVnRXhwID0gQ09OU1RBTlRTLmRlZmF1bHRDbGFzc1ByZWZpeFJlZ0V4cDtcblxuICAgICAgICAgICAgJGJvZHkgPSAkKGJvZHlUZW1wbGF0ZS5yZXBsYWNlKGRlZmF1bHRDbGFzc1ByZWZpeFJlZ0V4cCwgY2xhc3NQcmVmaXgpKTtcbiAgICAgICAgICAgICRlbGVtZW50LmFwcGVuZCgkYm9keSk7XG4gICAgICAgIH1cbiAgICAgICAgJHdlZWtUZW1wbGF0ZSA9ICRib2R5LmZpbmQoY2xhc3NTZWxlY3RvciArICd3ZWVrJyk7XG4gICAgICAgIHRoaXMuJHdlZWtUZW1wbGF0ZSA9ICR3ZWVrVGVtcGxhdGUuY2xvbmUodHJ1ZSk7XG4gICAgICAgIHRoaXMuJHdlZWtBcHBlbmRUYXJnZXQgPSAkd2Vla1RlbXBsYXRlLnBhcmVudCgpO1xuICAgICAgICB0aGlzLiRib2R5ID0gJGJvZHk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIGZvb3RlciBlbGVtZW50XG4gICAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtZW50IFRoZSByb290IGVsZW1lbnQgb2YgY29tcG9uZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzU2VsZWN0b3IgQSBzZWxlY3RvclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc1ByZWZpeCBBIHByZWZpeCBmb3IgY2xhc3NcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hc3NpZ25Gb290ZXI6IGZ1bmN0aW9uKCRlbGVtZW50LCBjbGFzc1NlbGVjdG9yLCBjbGFzc1ByZWZpeCkge1xuICAgICAgICB2YXIgJGZvb3RlciA9ICRlbGVtZW50LmZpbmQoY2xhc3NTZWxlY3RvciArICdmb290ZXInKSxcbiAgICAgICAgICAgIGZvb3RlclRlbXBsYXRlLFxuICAgICAgICAgICAgZGVmYXVsdENsYXNzUHJlZml4UmVnRXhwO1xuXG4gICAgICAgIGlmICghJGZvb3Rlci5sZW5ndGgpIHtcbiAgICAgICAgICAgIGZvb3RlclRlbXBsYXRlID0gQ09OU1RBTlRTLmNhbGVuZGFyRm9vdGVyO1xuICAgICAgICAgICAgZGVmYXVsdENsYXNzUHJlZml4UmVnRXhwID0gQ09OU1RBTlRTLmRlZmF1bHRDbGFzc1ByZWZpeFJlZ0V4cDtcblxuICAgICAgICAgICAgJGZvb3RlciA9ICQoZm9vdGVyVGVtcGxhdGUucmVwbGFjZShkZWZhdWx0Q2xhc3NQcmVmaXhSZWdFeHAsIGNsYXNzUHJlZml4KSk7XG4gICAgICAgICAgICAkZWxlbWVudC5hcHBlbmQoJGZvb3Rlcik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4kdG9kYXkgPSAkZm9vdGVyLmZpbmQoY2xhc3NTZWxlY3RvciArICd0b2RheScpO1xuICAgICAgICB0aGlzLiRmb290ZXIgPSAkZm9vdGVyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgbmF2aWdhdGlvbiBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2F0dGFjaEV2ZW50VG9Sb2xsb3ZlckJ0bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBidG5zID0gdGhpcy4kaGVhZGVyLmZpbmQoJy5yb2xsb3ZlcicpO1xuXG4gICAgICAgIGJ0bnMub24oJ2NsaWNrJywgdXRpbC5iaW5kKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHJlbGF0aXZlTW9udGhWYWx1ZSA9ICQoZXZlbnQudGFyZ2V0KS5kYXRhKENPTlNUQU5UUy5yZWxhdGl2ZU1vbnRoVmFsdWVLZXkpO1xuICAgICAgICAgICAgdGhpcy5kcmF3KDAsIHJlbGF0aXZlTW9udGhWYWx1ZSwgdHJ1ZSk7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9LCB0aGlzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBIYXNoIGRhdGEgdG8gZHJvdyBjYWxlbmRhclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5ZWFyIEEgeWVhclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBtb250aCBBIG1vbnRoXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNSZWxhdGl2ZV0gIFdoZXRoZXIgaXMgcmVsYXRlZCBvdGhlciB2YWx1ZSBvciBub3RcbiAgICAgKiBAcmV0dXJucyB7e3llYXI6IG51bWJlciwgbW9udGg6IG51bWJlcn19IEEgZGF0ZSBoYXNoXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0RGF0ZUZvckRyYXdpbmc6IGZ1bmN0aW9uKHllYXIsIG1vbnRoLCBpc1JlbGF0aXZlKSB7XG4gICAgICAgIHZhciBuRGF0ZSA9IHRoaXMuZ2V0RGF0ZSgpLFxuICAgICAgICAgICAgcmVsYXRpdmVEYXRlO1xuXG4gICAgICAgIG5EYXRlLmRhdGUgPSAxO1xuICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXIoeWVhcikgJiYgIXV0aWwuaXNOdW1iZXIobW9udGgpKSB7XG4gICAgICAgICAgICByZXR1cm4gbkRhdGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNSZWxhdGl2ZSkge1xuICAgICAgICAgICAgcmVsYXRpdmVEYXRlID0gdXRpbHMuZ2V0UmVsYXRpdmVEYXRlKHllYXIsIG1vbnRoLCAwLCBuRGF0ZSk7XG4gICAgICAgICAgICBuRGF0ZS55ZWFyID0gcmVsYXRpdmVEYXRlLnllYXI7XG4gICAgICAgICAgICBuRGF0ZS5tb250aCA9IHJlbGF0aXZlRGF0ZS5tb250aDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5EYXRlLnllYXIgPSB5ZWFyIHx8IG5EYXRlLnllYXI7XG4gICAgICAgICAgICBuRGF0ZS5tb250aCA9IG1vbnRoIHx8IG5EYXRlLm1vbnRoO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5EYXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBKdWRnZSB0byByZWRyYXcgY2FsZW5kYXJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geWVhciBBIHllYXJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbW9udGggQSBtb250aFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSByZWZsb3cgXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfaXNOZWNlc3NhcnlGb3JEcmF3aW5nOiBmdW5jdGlvbih5ZWFyLCBtb250aCkge1xuICAgICAgICB2YXIgc2hvd25EYXRlID0gdGhpcy5fc2hvd25EYXRlO1xuXG4gICAgICAgIHJldHVybiAoc2hvd25EYXRlLnllYXIgIT09IHllYXIgfHwgc2hvd25EYXRlLm1vbnRoICE9PSBtb250aCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERyYXcgY2FsZW5kYXIgdGV4dFxuICAgICAqIEBwYXJhbSB7e3llYXI6IG51bWJlciwgbW9udGg6IG51bWJlcn19IGRhdGVGb3JEcmF3aW5nIFRoYSBoYXNoIHRoYXQgc2hvdyB1cCBvbiBjYWxlbmRhciBcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRDYWxlbmRhclRleHQ6IGZ1bmN0aW9uKGRhdGVGb3JEcmF3aW5nKSB7XG4gICAgICAgIHZhciB5ZWFyID0gZGF0ZUZvckRyYXdpbmcueWVhcixcbiAgICAgICAgICAgIG1vbnRoID0gZGF0ZUZvckRyYXdpbmcubW9udGg7XG5cbiAgICAgICAgdGhpcy5fc2V0Q2FsZW5kYXJUb2RheSgpO1xuICAgICAgICB0aGlzLl9zZXRDYWxlbmRhclRpdGxlKHllYXIsIG1vbnRoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRHJhdyBkYXRlcyBieSBtb250aC5cbiAgICAgKiBAcGFyYW0ge3t5ZWFyOiBudW1iZXIsIG1vbnRoOiBudW1iZXJ9fSBkYXRlRm9yRHJhd2luZyBBIGRhdGUgdG8gZHJhd1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc1ByZWZpeCBBIGNsYXNzIHByZWZpeFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2RyYXdEYXRlczogZnVuY3Rpb24oZGF0ZUZvckRyYXdpbmcsIGNsYXNzUHJlZml4KSB7XG4gICAgICAgIHZhciB5ZWFyID0gZGF0ZUZvckRyYXdpbmcueWVhcixcbiAgICAgICAgICAgIG1vbnRoID0gZGF0ZUZvckRyYXdpbmcubW9udGgsXG4gICAgICAgICAgICBkYXlJbldlZWsgPSAwLFxuICAgICAgICAgICAgZGF0ZVByZXZNb250aCA9IHV0aWxzLmdldFJlbGF0aXZlRGF0ZSgwLCAtMSwgMCwgZGF0ZUZvckRyYXdpbmcpLFxuICAgICAgICAgICAgZGF0ZU5leHRNb250aCA9IHV0aWxzLmdldFJlbGF0aXZlRGF0ZSgwLCAxLCAwLCBkYXRlRm9yRHJhd2luZyksXG4gICAgICAgICAgICBkYXRlcyA9IFtdLFxuICAgICAgICAgICAgZmlyc3REYXkgPSB1dGlscy5nZXRGaXJzdERheSh5ZWFyLCBtb250aCksXG4gICAgICAgICAgICBpbmRleE9mTGFzdERhdGUgPSB0aGlzLl9maWxsRGF0ZXMoeWVhciwgbW9udGgsIGRhdGVzKTtcblxuICAgICAgICB1dGlsLmZvckVhY2goZGF0ZXMsIGZ1bmN0aW9uKGRhdGUsIGkpIHtcbiAgICAgICAgICAgIHZhciBpc1ByZXZNb250aCA9IGZhbHNlLFxuICAgICAgICAgICAgICAgIGlzTmV4dE1vbnRoID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgJGRhdGVDb250YWluZXIgPSAkKHRoaXMuXyRkYXRlQ29udGFpbmVyRWxlbWVudFtpXSksXG4gICAgICAgICAgICAgICAgdGVtcFllYXIgPSB5ZWFyLFxuICAgICAgICAgICAgICAgIHRlbXBNb250aCA9IG1vbnRoLFxuICAgICAgICAgICAgICAgIGV2ZW50RGF0YTtcblxuICAgICAgICAgICAgaWYgKGkgPCBmaXJzdERheSkge1xuICAgICAgICAgICAgICAgIGlzUHJldk1vbnRoID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAkZGF0ZUNvbnRhaW5lci5hZGRDbGFzcyhjbGFzc1ByZWZpeCArIENPTlNUQU5UUy5wcmV2TW9udGgpO1xuICAgICAgICAgICAgICAgIHRlbXBZZWFyID0gZGF0ZVByZXZNb250aC55ZWFyO1xuICAgICAgICAgICAgICAgIHRlbXBNb250aCA9IGRhdGVQcmV2TW9udGgubW9udGg7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGkgPiBpbmRleE9mTGFzdERhdGUpIHtcbiAgICAgICAgICAgICAgICBpc05leHRNb250aCA9IHRydWU7XG4gICAgICAgICAgICAgICAgJGRhdGVDb250YWluZXIuYWRkQ2xhc3MoY2xhc3NQcmVmaXggKyBDT05TVEFOVFMubmV4dE1vbnRoKTtcbiAgICAgICAgICAgICAgICB0ZW1wWWVhciA9IGRhdGVOZXh0TW9udGgueWVhcjtcbiAgICAgICAgICAgICAgICB0ZW1wTW9udGggPSBkYXRlTmV4dE1vbnRoLm1vbnRoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXZWVrZW5kXG4gICAgICAgICAgICB0aGlzLl9zZXRXZWVrZW5kKGRheUluV2VlaywgJGRhdGVDb250YWluZXIsIGNsYXNzUHJlZml4KTtcblxuICAgICAgICAgICAgLy8gVG9kYXlcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc1RvZGF5KHRlbXBZZWFyLCB0ZW1wTW9udGgsIGRhdGUpKSB7XG4gICAgICAgICAgICAgICAgJGRhdGVDb250YWluZXIuYWRkQ2xhc3MoY2xhc3NQcmVmaXggKyAndG9kYXknKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXZlbnREYXRhID0ge1xuICAgICAgICAgICAgICAgICRkYXRlOiAkKHRoaXMuXyRkYXRlRWxlbWVudC5nZXQoaSkpLFxuICAgICAgICAgICAgICAgICRkYXRlQ29udGFpbmVyOiAkZGF0ZUNvbnRhaW5lcixcbiAgICAgICAgICAgICAgICB5ZWFyOiB0ZW1wWWVhcixcbiAgICAgICAgICAgICAgICBtb250aDogdGVtcE1vbnRoLFxuICAgICAgICAgICAgICAgIGRhdGU6IGRhdGUsXG4gICAgICAgICAgICAgICAgaXNQcmV2TW9udGg6IGlzUHJldk1vbnRoLFxuICAgICAgICAgICAgICAgIGlzTmV4dE1vbnRoOiBpc05leHRNb250aCxcbiAgICAgICAgICAgICAgICBodG1sOiBkYXRlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgJChldmVudERhdGEuJGRhdGUpLmh0bWwoZXZlbnREYXRhLmh0bWwudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICBkYXlJbldlZWsgPSAoZGF5SW5XZWVrICsgMSkgJSA3O1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEZpcmUgZHJhdyBldmVudCB3aGVuIGNhbGVuZGFyIGRyYXcgZWFjaCBkYXRlLlxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgQSBuYW1lIG9mIGN1c3RvbSBldmVudFxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBpc1ByZXZNb250aCBXaGV0aGVyIHRoZSBkcmF3IGRheSBpcyBsYXN0IG1vbnRoIG9yIG5vdFxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBpc05leHRNb250aCBXZWh0ZXIgdGhlIGRyYXcgZGF5IGlzIG5leHQgbW9udGggb3Igbm90XG4gICAgICAgICAgICAgKiBAcGFyYW0ge2pRdWVyeX0gJGRhdGUgVGhlIGVsZW1lbnQgaGF2ZSBkYXRlIGh0bWxcbiAgICAgICAgICAgICAqIEBwYXJhbSB7alF1ZXJ5fSAkZGF0ZUNvbnRhaW5lciBDaGlsZCBlbGVtZW50IHRoYXQgaGFzIGNsYXNzTmFtZSBbcHJlZml4XXdlZWsuIEl0IGlzIHBvc3NpYmxlIHRoaXMgZWxlbWVudCBlcXVlbCBlbERhdGUuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gZGF0ZSBBIGRyYXcgZGF0ZVxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IG1vbnRoIEEgZHJhdyBtb250aFxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHllYXIgQSBkcmF3IHllYXJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIEEgaHRtbCBzdHJpbmdcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiAvLyBkcmF3IGN1c3RvbSBldmVuIHRoYW5kbGVcbiAgICAgICAgICAgICAqIGNhbGVuZGFyLm9uKCdkcmF3JywgZnVuY3Rpb24oZHJhd0V2ZW50KXsgLi4uIH0pO1xuICAgICAgICAgICAgICoqL1xuICAgICAgICAgICAgdGhpcy5maXJlKCdkcmF3JywgZXZlbnREYXRhKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogSmVkZ2UgdGhlIGlucHV0IGRhdGUgaXMgdG9kYXkuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHllYXIgQSB5ZWFyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG1vbnRoIEEgbW9udGhcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZGF0ZSBBIGRhdGVcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfaXNUb2RheTogZnVuY3Rpb24oeWVhciwgbW9udGgsIGRhdGUpIHtcbiAgICAgICAgdmFyIHRvZGF5ID0gdXRpbHMuZ2V0RGF0ZUhhc2hUYWJsZSgpO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICB0b2RheS55ZWFyID09PSB5ZWFyICYmXG4gICAgICAgICAgICB0b2RheS5tb250aCA9PT0gbW9udGggJiZcbiAgICAgICAgICAgIHRvZGF5LmRhdGUgPT09IGRhdGVcbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBvbmUgd2VlayB0ZW1wYXRlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5ZWFyICBBIHllYXJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbW9udGggQSBtb250aFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFdlZWtzOiBmdW5jdGlvbih5ZWFyLCBtb250aCkge1xuICAgICAgICB2YXIgJGVsV2VlayxcbiAgICAgICAgICAgIHdlZWtzID0gdXRpbHMuZ2V0V2Vla3MoeWVhciwgbW9udGgpLFxuICAgICAgICAgICAgaTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHdlZWtzOyBpICs9IDEpIHtcbiAgICAgICAgICAgICRlbFdlZWsgPSB0aGlzLiR3ZWVrVGVtcGxhdGUuY2xvbmUodHJ1ZSk7XG4gICAgICAgICAgICAkZWxXZWVrLmFwcGVuZFRvKHRoaXMuJHdlZWtBcHBlbmRUYXJnZXQpO1xuICAgICAgICAgICAgdGhpcy5fd2Vla0VsZW1lbnRzLnB1c2goJGVsV2Vlayk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2F2ZSBkcmF3IGRhdGVzIHRvIGFycmF5XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHllYXIgQSBkcmF3IHllYXJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbW9udGggQSBkcmF3IG1vbnRoXG4gICAgICogQHBhcmFtIHtBcnJheX0gZGF0ZXMgQSBkcmF3IGRhdGVcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IGluZGV4IG9mIGxhc3QgZGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2ZpbGxEYXRlczogZnVuY3Rpb24oeWVhciwgbW9udGgsIGRhdGVzKSB7XG4gICAgICAgIHZhciBmaXJzdERheSA9IHV0aWxzLmdldEZpcnN0RGF5KHllYXIsIG1vbnRoKSxcbiAgICAgICAgICAgIGxhc3REYXkgPSB1dGlscy5nZXRMYXN0RGF5KHllYXIsIG1vbnRoKSxcbiAgICAgICAgICAgIGxhc3REYXRlID0gdXRpbHMuZ2V0TGFzdERhdGUoeWVhciwgbW9udGgpLFxuICAgICAgICAgICAgZGF0ZVByZXZNb250aCA9IHV0aWxzLmdldFJlbGF0aXZlRGF0ZSgwLCAtMSwgMCwge3llYXI6IHllYXIsIG1vbnRoOiBtb250aCwgZGF0ZTogMX0pLFxuICAgICAgICAgICAgcHJldk1vbnRoTGFzdERhdGUgPSB1dGlscy5nZXRMYXN0RGF0ZShkYXRlUHJldk1vbnRoLnllYXIsIGRhdGVQcmV2TW9udGgubW9udGgpLFxuICAgICAgICAgICAgaW5kZXhPZkxhc3REYXRlLFxuICAgICAgICAgICAgaTtcblxuICAgICAgICBpZiAoZmlyc3REYXkgPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSBwcmV2TW9udGhMYXN0RGF0ZSAtIGZpcnN0RGF5OyBpIDwgcHJldk1vbnRoTGFzdERhdGU7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGRhdGVzLnB1c2goaSArIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsYXN0RGF0ZSArIDE7IGkgKz0gMSkge1xuICAgICAgICAgICAgZGF0ZXMucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgICBpbmRleE9mTGFzdERhdGUgPSBkYXRlcy5sZW5ndGggLSAxO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgNyAtIGxhc3REYXk7IGkgKz0gMSkge1xuICAgICAgICAgICAgZGF0ZXMucHVzaChpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbmRleE9mTGFzdERhdGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCB3ZWVrZW5kXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGRheSBBIGRhdGVcbiAgICAgKiBAcGFyYW0ge2pRdWVyeX0gJGRhdGVDb250YWluZXIgQSBjb250YWluZXIgZWxlbWVudCBmb3IgZGF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc1ByZWZpeCBBIHByZWZpeCBvZiBjbGFzc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFdlZWtlbmQ6IGZ1bmN0aW9uKGRheSwgJGRhdGVDb250YWluZXIsIGNsYXNzUHJlZml4KSB7XG4gICAgICAgIGlmIChkYXkgPT09IDApIHtcbiAgICAgICAgICAgICRkYXRlQ29udGFpbmVyLmFkZENsYXNzKGNsYXNzUHJlZml4ICsgJ3N1bicpO1xuICAgICAgICB9IGVsc2UgaWYgKGRheSA9PT0gNikge1xuICAgICAgICAgICAgJGRhdGVDb250YWluZXIuYWRkQ2xhc3MoY2xhc3NQcmVmaXggKyAnc2F0Jyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgY2FsZW5kYXJcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3dlZWtFbGVtZW50cyA9IFtdO1xuICAgICAgICB0aGlzLiR3ZWVrQXBwZW5kVGFyZ2V0LmVtcHR5KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERyYXcgdGl0bGUgd2l0aCBmb3JtYXQgb3B0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5ZWFyIEEgdmFsdWUgb2YgeWVhciAoZXguIDIwMDgpXG4gICAgICogQHBhcmFtIHsobnVtYmVyfHN0cmluZyl9IG1vbnRoIEEgbW9udGggKDEgfiAxMilcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqKi9cbiAgICBfc2V0Q2FsZW5kYXJUaXRsZTogZnVuY3Rpb24oeWVhciwgbW9udGgpIHtcbiAgICAgICAgdmFyIG9wdGlvbiA9IHRoaXMuX29wdGlvbixcbiAgICAgICAgICAgIHRpdGxlRm9ybWF0ID0gb3B0aW9uLnRpdGxlRm9ybWF0LFxuICAgICAgICAgICAgcmVwbGFjZU1hcCxcbiAgICAgICAgICAgIHJlZztcblxuICAgICAgICBtb250aCA9IHRoaXMuX3ByZXBlbmRMZWFkaW5nWmVybyhtb250aCk7XG4gICAgICAgIHJlcGxhY2VNYXAgPSB0aGlzLl9nZXRSZXBsYWNlTWFwKHllYXIsIG1vbnRoKTtcblxuICAgICAgICByZWcgPSBDT05TVEFOVFMudGl0bGVSZWdFeHA7XG4gICAgICAgIHRoaXMuX3NldERhdGVUZXh0SW5DYWxlbmRhcih0aGlzLiR0aXRsZSwgdGl0bGVGb3JtYXQsIHJlcGxhY2VNYXAsIHJlZyk7XG5cbiAgICAgICAgcmVnID0gQ09OU1RBTlRTLnRpdGxlWWVhclJlZ0V4cDtcbiAgICAgICAgdGhpcy5fc2V0RGF0ZVRleHRJbkNhbGVuZGFyKHRoaXMuJHRpdGxlWWVhciwgb3B0aW9uLnllYXJUaXRsZUZvcm1hdCwgcmVwbGFjZU1hcCwgcmVnKTtcblxuICAgICAgICByZWcgPSBDT05TVEFOVFMudGl0bGVNb250aFJlZ0V4cDtcbiAgICAgICAgdGhpcy5fc2V0RGF0ZVRleHRJbkNhbGVuZGFyKHRoaXMuJHRpdGxlTW9udGgsIG9wdGlvbi5tb250aFRpdGxlRm9ybWF0LCByZXBsYWNlTWFwLCByZWcpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgdGl0bGVcbiAgICAgKiBAcGFyYW0ge2pRdWVyeXxIVE1MRWxlbWVudH0gZWxlbWVudCBBIHVwZGF0ZSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZvcm0gQSB1cGRhdGUgZm9ybVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBtYXAgQSBvYmplY3QgdGhhdCBoYXMgdmFsdWUgbWF0Y2hlZCByZWdFeHBcbiAgICAgKiBAcGFyYW0ge1JlZ0V4cH0gcmVnIEEgcmVnRXhwIHRvIGNoYWduZSBmb3JtXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0RGF0ZVRleHRJbkNhbGVuZGFyOiBmdW5jdGlvbihlbGVtZW50LCBmb3JtLCBtYXAsIHJlZykge1xuICAgICAgICB2YXIgdGl0bGUsXG4gICAgICAgICAgICAkZWwgPSAkKGVsZW1lbnQpO1xuXG4gICAgICAgIGlmICghJGVsLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRpdGxlID0gdGhpcy5fZ2V0Q29udmVydGVkVGl0bGUoZm9ybSwgbWFwLCByZWcpO1xuICAgICAgICAkZWwudGV4dCh0aXRsZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBtYXAgZGF0YSBmb3IgZm9ybVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0geWVhciBBIHllYXJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IG1vbnRoIEEgbW9udGhcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IFtkYXRlXSBBIGRheVxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJlcGxhY2VNYXBcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRSZXBsYWNlTWFwOiBmdW5jdGlvbih5ZWFyLCBtb250aCwgZGF0ZSkge1xuICAgICAgICB2YXIgb3B0aW9uID0gdGhpcy5fb3B0aW9uLFxuICAgICAgICAgICAgeWVhclN1YiA9ICh5ZWFyLnRvU3RyaW5nKCkpLnN1YnN0cigyLCAyKSxcbiAgICAgICAgICAgIG1vbnRoTGFiZWwgPSBvcHRpb24ubW9udGhUaXRsZXNbbW9udGggLSAxXSxcbiAgICAgICAgICAgIGxhYmVsS2V5ID0gbmV3IERhdGUoeWVhciwgbW9udGggLSAxLCBkYXRlIHx8IDEpLmdldERheSgpLFxuICAgICAgICAgICAgZGF5TGFiZWwgPSBvcHRpb24uZGF5VGl0bGVzW2xhYmVsS2V5XTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeXl5eTogeWVhcixcbiAgICAgICAgICAgIHl5OiB5ZWFyU3ViLFxuICAgICAgICAgICAgbW06IG1vbnRoLFxuICAgICAgICAgICAgbTogTnVtYmVyKG1vbnRoKSxcbiAgICAgICAgICAgIE06IG1vbnRoTGFiZWwsXG4gICAgICAgICAgICBkZDogZGF0ZSxcbiAgICAgICAgICAgIGQ6IE51bWJlcihkYXRlKSxcbiAgICAgICAgICAgIEQ6IGRheUxhYmVsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoYWdlIHRleHQgYW5kIHJldHVybi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyIEEgdGV4dCB0byBjaGFnbmVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbWFwIEEgY2hhZ25lIGtleSwgdmFsdWUgc2V0XG4gICAgICogQHBhcmFtIHtSZWdFeHB9IHJlZyBBIHJlZ0V4cCB0byBjaGFnbmUgXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRDb252ZXJ0ZWRUaXRsZTogZnVuY3Rpb24oc3RyLCBtYXAsIHJlZykge1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZShyZWcsIGZ1bmN0aW9uKG1hdGNoZWRTdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXBbbWF0Y2hlZFN0cmluZ10gfHwgJyc7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdG9kYXlcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRDYWxlbmRhclRvZGF5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICR0b2RheSA9IHRoaXMuJHRvZGF5LFxuICAgICAgICAgICAgdG9kYXlGb3JtYXQsXG4gICAgICAgICAgICB0b2RheSxcbiAgICAgICAgICAgIHllYXIsXG4gICAgICAgICAgICBtb250aCxcbiAgICAgICAgICAgIGRhdGUsXG4gICAgICAgICAgICByZXBsYWNlTWFwLFxuICAgICAgICAgICAgcmVnO1xuXG4gICAgICAgIGlmICghJHRvZGF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdG9kYXkgPSB1dGlscy5nZXREYXRlSGFzaFRhYmxlKCk7XG4gICAgICAgIHllYXIgPSB0b2RheS55ZWFyO1xuICAgICAgICBtb250aCA9IHRoaXMuX3ByZXBlbmRMZWFkaW5nWmVybyh0b2RheS5tb250aCk7XG4gICAgICAgIGRhdGUgPSB0aGlzLl9wcmVwZW5kTGVhZGluZ1plcm8odG9kYXkuZGF0ZSk7XG4gICAgICAgIHRvZGF5Rm9ybWF0ID0gdGhpcy5fb3B0aW9uLnRvZGF5Rm9ybWF0O1xuICAgICAgICByZXBsYWNlTWFwID0gdGhpcy5fZ2V0UmVwbGFjZU1hcCh5ZWFyLCBtb250aCwgZGF0ZSk7XG4gICAgICAgIHJlZyA9IENPTlNUQU5UUy50b2RheVJlZ0V4cDtcbiAgICAgICAgdGhpcy5fc2V0RGF0ZVRleHRJbkNhbGVuZGFyKCR0b2RheSwgdG9kYXlGb3JtYXQsIHJlcGxhY2VNYXAsIHJlZyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoYWduZSBudW1iZXIgMH45IHRvICcwMH4wOSdcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyIG51bWJlclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqICB0aGlzLl9wcmVwZW5kTGVhZGluZ1plcm8oMCk7IC8vICAnMDAnXG4gICAgICogIHRoaXMuX3ByZXBlbmRMZWFkaW5nWmVybyg5KTsgLy8gICcwOSdcbiAgICAgKiAgdGhpcy5fcHJlcGVuZExlYWRpbmdaZXJvKDEyKTsgLy8gICcxMidcbiAgICAgKi9cbiAgICBfcHJlcGVuZExlYWRpbmdaZXJvOiBmdW5jdGlvbihudW1iZXIpIHtcbiAgICAgICAgdmFyIHByZWZpeCA9ICcnO1xuXG4gICAgICAgIGlmIChudW1iZXIgPCAxMCkge1xuICAgICAgICAgICAgcHJlZml4ID0gJzAnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcmVmaXggKyBudW1iZXI7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERyYXcgY2FsZW5kYXJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3llYXJdIEEgeWVhciAoZXguIDIwMDgpXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFttb250aF0gQSBtb250aCAoMSB+IDEyKVxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2lzUmVsYXRpdmVdICBBIHllYXIgYW5kIG1vbnRoIGlzIHJlbGF0ZWRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNhbGVuZGFyLmRyYXcoKTsgLy8gRHJhdyB3aXRoIG5vdyBkYXRlLlxuICAgICAqIGNhbGVuZGFyLmRyYXcoMjAwOCwgMTIpOyAvLyBEcmF3IDIwMDgvMTJcbiAgICAgKiBjYWxlbmRhci5kcmF3KG51bGwsIDEyKTsgLy8gRHJhdyBjdXJyZW50IHllYXIvMTJcbiAgICAgKiBjYWxlbmRhci5kcmF3KDIwMTAsIG51bGwpOyAvLyBEcmF3IDIwMTAvY3VycmVudCBtb250aFxuICAgICAqIGNhbGVuZGFyLmRyYXcoMCwgMSwgdHJ1ZSk7IC8vIERyYXcgbmV4dCBtb250aFxuICAgICAqIGNhbGVuZGFyLmRyYXcoLTEsIG51bGwsIHRydWUpOyAvLyBEcmF3IHByZXYgeWVhclxuICAgICAqKi9cbiAgICBkcmF3OiBmdW5jdGlvbih5ZWFyLCBtb250aCwgaXNSZWxhdGl2ZSkge1xuICAgICAgICB2YXIgZGF0ZUZvckRyYXdpbmcgPSB0aGlzLl9nZXREYXRlRm9yRHJhd2luZyh5ZWFyLCBtb250aCwgaXNSZWxhdGl2ZSksXG4gICAgICAgICAgICBpc1JlYWR5Rm9yRHJhd2luZyA9IHRoaXMuaW52b2tlKCdiZWZvcmVEcmF3JywgZGF0ZUZvckRyYXdpbmcpLFxuICAgICAgICAgICAgY2xhc3NQcmVmaXg7XG5cbiAgICAgICAgLyoqPT09PT09PT09PT09PT09XG4gICAgICAgICAqIGJlZm9yZURyYXdcbiAgICAgICAgID09PT09PT09PT09PT09PT09Ki9cbiAgICAgICAgaWYgKCFpc1JlYWR5Rm9yRHJhd2luZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqPT09PT09PT09PT09PT09XG4gICAgICAgICAqIGRyYXdcbiAgICAgICAgID09PT09PT09PT09PT09PT09Ki9cbiAgICAgICAgeWVhciA9IGRhdGVGb3JEcmF3aW5nLnllYXI7XG4gICAgICAgIG1vbnRoID0gZGF0ZUZvckRyYXdpbmcubW9udGg7XG5cbiAgICAgICAgY2xhc3NQcmVmaXggPSB0aGlzLl9vcHRpb24uY2xhc3NQcmVmaXg7XG4gICAgICAgIHRoaXMuX2NsZWFyKCk7XG4gICAgICAgIHRoaXMuX3NldENhbGVuZGFyVGV4dChkYXRlRm9yRHJhd2luZyk7XG5cbiAgICAgICAgLy8gd2Vla3NcbiAgICAgICAgdGhpcy5fc2V0V2Vla3MoeWVhciwgbW9udGgpO1xuICAgICAgICB0aGlzLl8kZGF0ZUVsZW1lbnQgPSAkKCcuJyArIGNsYXNzUHJlZml4ICsgJ2RhdGUnLCB0aGlzLiR3ZWVrQXBwZW5kVGFyZ2V0KTtcbiAgICAgICAgdGhpcy5fJGRhdGVDb250YWluZXJFbGVtZW50ID0gJCgnLicgKyBjbGFzc1ByZWZpeCArICd3ZWVrID4gKicsIHRoaXMuJHdlZWtBcHBlbmRUYXJnZXQpO1xuXG4gICAgICAgIC8vIGRhdGVzXG4gICAgICAgIHRoaXMuc2V0RGF0ZSh5ZWFyLCBtb250aCk7XG4gICAgICAgIHRoaXMuX2RyYXdEYXRlcyhkYXRlRm9yRHJhd2luZywgY2xhc3NQcmVmaXgpO1xuICAgICAgICB0aGlzLiRlbGVtZW50LnNob3coKTtcblxuICAgICAgICAvKio9PT09PT09PT09PT09PT1cbiAgICAgICAgICogYWZ0ZXJEcmF3XG4gICAgICAgICA9PT09PT09PT09PT09PT09Ki9cbiAgICAgICAgdGhpcy5maXJlKCdhZnRlckRyYXcnLCBkYXRlRm9yRHJhd2luZyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBjdXJyZW50IHllYXIgYW5kIG1vbnRoKGp1c3Qgc2hvd24pLlxuICAgICAqIEByZXR1cm5zIHt7eWVhcjogbnVtYmVyLCBtb250aDogbnVtYmVyfX1cbiAgICAgKi9cbiAgICBnZXREYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHllYXI6IHRoaXMuX3Nob3duRGF0ZS55ZWFyLFxuICAgICAgICAgICAgbW9udGg6IHRoaXMuX3Nob3duRGF0ZS5tb250aFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZGF0ZVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbeWVhcl0gQSB5ZWFyIChleC4gMjAwOClcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW21vbnRoXSBBIG1vbnRoICgxIH4gMTIpXG4gICAgICoqL1xuICAgIHNldERhdGU6IGZ1bmN0aW9uKHllYXIsIG1vbnRoKSB7XG4gICAgICAgIHZhciBkYXRlID0gdGhpcy5fc2hvd25EYXRlO1xuICAgICAgICBkYXRlLnllYXIgPSB1dGlsLmlzTnVtYmVyKHllYXIpID8geWVhciA6IGRhdGUueWVhcjtcbiAgICAgICAgZGF0ZS5tb250aCA9IHV0aWwuaXNOdW1iZXIobW9udGgpID8gbW9udGggOiBkYXRlLm1vbnRoO1xuICAgIH1cbn0pO1xuXG51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihDYWxlbmRhcik7XG5tb2R1bGUuZXhwb3J0cyA9IENhbGVuZGFyO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFV0aWxzIGZvciBjYWxlbmRhciBjb21wb25lbnRcbiAqIEBhdXRob3IgTkhOIE5ldC4gRkUgZGV2IHRlYW0uIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgfjEuMC4yXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFV0aWxzIG9mIGNhbGVuZGFyXG4gKiBAbmFtZXNwYWNlIHV0aWxzXG4gKi9cbnZhciB1dGlscyA9IHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm4gZGF0ZSBoYXNoIGJ5IHBhcmFtZXRlci5cbiAgICAgKiAgaWYgdGhlcmUgYXJlIDMgcGFyYW1ldGVyLCB0aGUgcGFyYW1ldGVyIGlzIGNvcmduaXplZCBEYXRlIG9iamVjdFxuICAgICAqICBpZiB0aGVyZSBhcmUgbm8gcGFyYW1ldGVyLCByZXR1cm4gdG9kYXkncyBoYXNoIGRhdGVcbiAgICAgKiBAZnVuY3Rpb24gZ2V0RGF0ZUhhc2hUYWJsZVxuICAgICAqIEBtZW1iZXJvZiB1dGlsc1xuICAgICAqIEBwYXJhbSB7RGF0ZXxudW1iZXJ9IFt5ZWFyXSBBIGRhdGUgaW5zdGFuY2Ugb3IgeWVhclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbbW9udGhdIEEgbW9udGhcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2RhdGVdIEEgZGF0ZVxuICAgICAqIEByZXR1cm5zIHt7eWVhcjogKiwgbW9udGg6ICosIGRhdGU6ICp9fSBcbiAgICAgKi9cbiAgICBnZXREYXRlSGFzaFRhYmxlOiBmdW5jdGlvbih5ZWFyLCBtb250aCwgZGF0ZSkge1xuICAgICAgICB2YXIgbkRhdGU7XG5cbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XG4gICAgICAgICAgICBuRGF0ZSA9IGFyZ3VtZW50c1swXSB8fCBuZXcgRGF0ZSgpO1xuXG4gICAgICAgICAgICB5ZWFyID0gbkRhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICAgICAgICAgIG1vbnRoID0gbkRhdGUuZ2V0TW9udGgoKSArIDE7XG4gICAgICAgICAgICBkYXRlID0gbkRhdGUuZ2V0RGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHllYXI6IHllYXIsXG4gICAgICAgICAgICBtb250aDogbW9udGgsXG4gICAgICAgICAgICBkYXRlOiBkYXRlXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0b2RheSB0aGF0IHNhdmVkIG9uIGNvbXBvbmVudCBvciBjcmVhdGUgbmV3IGRhdGUuXG4gICAgICogQGZ1bmN0aW9uIGdldFRvZGF5XG4gICAgICogQHJldHVybnMge3t5ZWFyOiAqLCBtb250aDogKiwgZGF0ZTogKn19XG4gICAgICogQG1lbWJlcm9mIHV0aWxzXG4gICAgICovXG4gICAgZ2V0VG9kYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgIHJldHVybiB1dGlscy5nZXREYXRlSGFzaFRhYmxlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB3ZWVrcyBjb3VudCBieSBwYXJhbWVudGVyXG4gICAgICogQGZ1bmN0aW9uIGdldFdlZWtzXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHllYXIgQSB5ZWFyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG1vbnRoIEEgbW9udGhcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IOyjvCAoNH42KVxuICAgICAqIEBtZW1iZXJvZiB1dGlsc1xuICAgICAqKi9cbiAgICBnZXRXZWVrczogZnVuY3Rpb24oeWVhciwgbW9udGgpIHtcbiAgICAgICAgdmFyIGZpcnN0RGF5ID0gdGhpcy5nZXRGaXJzdERheSh5ZWFyLCBtb250aCksXG4gICAgICAgICAgICBsYXN0RGF0ZSA9IHRoaXMuZ2V0TGFzdERhdGUoeWVhciwgbW9udGgpO1xuXG4gICAgICAgIHJldHVybiBNYXRoLmNlaWwoKGZpcnN0RGF5ICsgbGFzdERhdGUpIC8gNyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB1bml4IHRpbWUgZnJvbSBkYXRlIGhhc2hcbiAgICAgKiBAZnVuY3Rpb24gZ2V0VGltZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRlIEEgZGF0ZSBoYXNoXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGRhdGUueWVhciBBIHllYXJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZGF0ZS5tb250aCBBIG1vbnRoXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGRhdGUuZGF0ZSBBIGRhdGVcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IFxuICAgICAqIEBtZW1iZXJvZiB1dGlsc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogdXRpbHMuZ2V0VGltZSh7eWVhcjoyMDEwLCBtb250aDo1LCBkYXRlOjEyfSk7IC8vIDEyNzM1OTAwMDAwMDBcbiAgICAgKiovXG4gICAgZ2V0VGltZTogZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXREYXRlT2JqZWN0KGRhdGUpLmdldFRpbWUoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHdoaWNoIGRheSBpcyBmaXJzdCBieSBwYXJhbWV0ZXJzIHRoYXQgaW5jbHVkZSB5ZWFyIGFuZCBtb250aCBpbmZvcm1hdGlvbi5cbiAgICAgKiBAZnVuY3Rpb24gZ2V0Rmlyc3REYXlcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geWVhciBBIHllYXJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbW9udGggQSBtb250aFxuICAgICAqIEByZXR1cm4ge251bWJlcn0gKDB+NilcbiAgICAgKiBAbWVtYmVyb2YgdXRpbHNcbiAgICAgKiovXG4gICAgZ2V0Rmlyc3REYXk6IGZ1bmN0aW9uKHllYXIsIG1vbnRoKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZSh5ZWFyLCBtb250aCAtIDEsIDEpLmdldERheSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgd2hpY2ggZGF5IGlzIGxhc3QgYnkgcGFyYW1ldGVycyB0aGF0IGluY2x1ZGUgeWVhciBhbmQgbW9udGggaW5mb3JtYXRpb24uXG4gICAgICogQGZ1bmN0aW9uIGdldExhc3REYXlcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geWVhciBBIHllYXJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbW9udGggQSBtb250aFxuICAgICAqIEByZXR1cm4ge251bWJlcn0gKDB+NilcbiAgICAgKiBAbWVtYmVyb2YgdXRpbHNcbiAgICAgKiovXG4gICAgZ2V0TGFzdERheTogZnVuY3Rpb24oeWVhciwgbW9udGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKHllYXIsIG1vbnRoLCAwKS5nZXREYXkoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGxhc3QgZGF0ZSBieSBwYXJhbWV0ZXJzIHRoYXQgaW5jbHVkZSB5ZWFyIGFuZCBtb250aCBpbmZvcm1hdGlvbi5cbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge251bWJlcn0geWVhciBBIHllYXJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbW9udGggQSBtb250aFxuICAgICAqIEByZXR1cm4ge251bWJlcn0gKDF+MzEpXG4gICAgICogQG1lbWJlcm9mIHV0aWxzXG4gICAgICoqL1xuICAgIGdldExhc3REYXRlOiBmdW5jdGlvbih5ZWFyLCBtb250aCkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGUoeWVhciwgbW9udGgsIDApLmdldERhdGUoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGRhdGUgaW5zdGFuY2UuXG4gICAgICogQGZ1bmN0aW9uIGdldERhdGVPYmplY3RcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0ZSBBIGRhdGUgaGFzaFxuICAgICAqIEByZXR1cm4ge0RhdGV9IERhdGUgIFxuICAgICAqIEBtZW1iZXJvZiB1dGlsc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogIHV0aWxzLmdldERhdGVPYmplY3Qoe3llYXI6MjAxMCwgbW9udGg6NSwgZGF0ZToxMn0pO1xuICAgICAqICB1dGlscy5nZXREYXRlT2JqZWN0KDIwMTAsIDUsIDEyKTsgLy95ZWFyLG1vbnRoLGRhdGVcbiAgICAgKiovXG4gICAgZ2V0RGF0ZU9iamVjdDogZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzFdIC0gMSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IERhdGUoZGF0ZS55ZWFyLCBkYXRlLm1vbnRoIC0gMSwgZGF0ZS5kYXRlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHJlbGF0ZWQgZGF0ZSBoYXNoIHdpdGggcGFyYW1ldGVycyB0aGF0IGluY2x1ZGUgZGF0ZSBpbmZvcm1hdGlvbi5cbiAgICAgKiBAZnVuY3Rpb24gZ2V0UmVsYXRpdmVEYXRlXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHllYXIgQSByZWxhdGVkIHZhbHVlIGZvciB5ZWFyKHlvdSBjYW4gdXNlICsvLSlcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbW9udGggQSByZWxhdGVkIHZhbHVlIGZvciBtb250aCAoeW91IGNhbiB1c2UgKy8tKVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBkYXRlIEEgcmVsYXRlZCB2YWx1ZSBmb3IgZGF5ICh5b3UgY2FuIHVzZSArLy0pXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGVPYmogc3RhbmRhcmQgZGF0ZSBoYXNoXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBkYXRlT2JqIFxuICAgICAqIEBtZW1iZXJvZiB1dGlsc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogIHV0aWxzLmdldFJlbGF0aXZlRGF0ZSgxLCAwLCAwLCB7eWVhcjoyMDAwLCBtb250aDoxLCBkYXRlOjF9KTsgLy8ge3llYXI6MjAwMSwgbW9udGg6MSwgZGF0ZToxfVxuICAgICAqICB1dGlscy5nZXRSZWxhdGl2ZURhdGUoMCwgMCwgLTEsIHt5ZWFyOjIwMTAsIG1vbnRoOjEsIGRhdGU6MX0pOyAvLyB7eWVhcjoyMDA5LCBtb250aDoxMiwgZGF0ZTozMX1cbiAgICAgKiovXG4gICAgZ2V0UmVsYXRpdmVEYXRlOiBmdW5jdGlvbih5ZWFyLCBtb250aCwgZGF0ZSwgZGF0ZU9iaikge1xuICAgICAgICB2YXIgblllYXIgPSAoZGF0ZU9iai55ZWFyICsgeWVhciksXG4gICAgICAgICAgICBuTW9udGggPSAoZGF0ZU9iai5tb250aCArIG1vbnRoIC0gMSksXG4gICAgICAgICAgICBuRGF0ZSA9IChkYXRlT2JqLmRhdGUgKyBkYXRlKSxcbiAgICAgICAgICAgIG5EYXRlT2JqID0gbmV3IERhdGUoblllYXIsIG5Nb250aCwgbkRhdGUpO1xuXG4gICAgICAgIHJldHVybiB1dGlscy5nZXREYXRlSGFzaFRhYmxlKG5EYXRlT2JqKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxzO1xuIl19
