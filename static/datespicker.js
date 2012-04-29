;DatesPicker = function(settings) {
    this.options = $.extend({
        overlay: true,
        futureMonths: 3,
        debug: false,
        duration: 200,
        start: null
    }, settings);
    
    this.els = {};
    this.dates = {};
    this.state = {};
    this.offset = 0;
    this.now = new Date();

    this.isAnimated = false;

    this.transform = window.utils.supports('transform');
    
    this.monthLabels = [
        'Январь',
        'Февраль',
        'Март',
        'Апрель',
        'Май',
        'Июнь',
        'Июль',
        'Август',
        'Сентябрь',
        'Октябрь',
        'Ноябрь',
        'Декабрь'
    ];
    
    this.status = 'checkin';
};
DatesPicker.prototype.init = function() {
    this.els.block = $('#dates-picker');
    this.els.datelistHolder = this.els.block.find('#cal_datelist_holder');

    this.els.monthHeader = this.els.block.find('#cal_visible_month');

    this.els.controls = this.els.block.find('.cal-controls');
    this.els.controlUp = this.els.controls.filter('.cal-control-up');
    this.els.controlDown = this.els.controls.filter('.cal-control-down');

    if (this.options.start !== null) {
        this.dates.current = new Date(this.options.start.getFullYear(), this.options.start.getMonth());
        this.dates.start = new Date(this.options.start.getFullYear(), this.options.start.getMonth());
        this.dates.end = new Date(this.options.start.getFullYear(), this.options.start.getMonth() + this.options.futureMonths);
    }
    else {
        this.dates.current = new Date(this.now.getFullYear(), this.now.getMonth());
        this.dates.start = new Date(this.now.getFullYear(), this.now.getMonth());
        this.dates.end = new Date(this.now.getFullYear(), this.now.getMonth() + this.options.futureMonths);
    }

    this.els.dateList = $(oCalendar.generate({
        start: {
            month: this.dates.start.getMonth() + 1,
            year: this.dates.start.getFullYear()
        },
        end: {
            month: this.dates.end.getMonth() + 1,
            year: this.dates.end.getFullYear()
        },
        type: 'list',
        monthlabels: this.options.debug
    }));

    // Selecting proper cells to work with
    this.els.cells = this.els.dateList.children('li[data-date]');
        
    if (this.options.arrival && this.options.departure) {
        this.setDates(this.options.arrival, this.options.departure);
        this.dates.current = this.YMDToDateMonth(this.options.arrival);
    }

    this.els.datelistHolder.append(this.els.dateList);

    // get sizes set base position for the calendar
    this.cellHeight = this.els.cells.eq(0).height();
    this.scrollCalendarTo(this.dates.current.getFullYear(), this.dates.current.getMonth(), true);

    this.logic();

    $.pub('datespicker_ready');
};

DatesPicker.prototype.logic = function() {
    var that = this;
    
    var changeMonth = function(shift) {
        that.scrollCalendarTo(that.dates.current.getFullYear(), that.dates.current.getMonth() + shift);
    };
    
    var handleControls = function(e) {
        window.utils.e(e);
        
        var el = $(this);
        if (!el.hasClass('disabled') && !that.isAnimated) {
            changeMonth(el.hasClass('cal-control-up') ? -1 : 1);
        }
    };
    
    var proxyHandler = function(e) {
        window.utils.e(e);
        that._handleCells.call(that, this);
    };
    
    this.els.controls.onpress(handleControls);
    this.els.dateList.onpress('li', proxyHandler);
};
    
DatesPicker.prototype._handleCells = function(elem) {
    var el = $(elem),
        ymd = el.data('date'),
        date = this.YMDToDateMonth(ymd),
        edate = +date,
        ecurr = +this.dates.current;

    if (el.hasClass('past')) {
        return;
    }
        
    if (this.status === 'checkout' && this.state.checkin === ymd) {// Selecting the same date again?
        return;
    }

    if ((edate < ecurr) || (edate > ecurr)) { // edgy dates autoscroll
        this.scrollCalendarTo(date.getFullYear(), date.getMonth());
    }
        
    if (this.status === 'checkin') {
        this.state.checkin = ymd;

        this.els.cells.filter('.selected').removeClass('selected');
        this.els.cells.filter('.checkin').removeClass('checkin');
        this.els.cells.filter('.checkout').removeClass('checkout');

        el.addClass('selected');
            
        this.status = 'checkout';
        this.els.block.removeClass('checkin').addClass('checkout');
        $.pub('datespicker_checkin');
    }
    else {
        this.setDates(this.state.checkin, ymd);

        this.status = 'checkin';
        this.els.block.removeClass('checkout').addClass('checkin');
        $.pub('datespicker_checkout');
    }
};

DatesPicker.prototype.checkScrollability = function(next) {
    var enext = +next,
        estart = +this.dates.start,
        eend = +this.dates.end;
            
    if (this.isAnimated) {
        return false;
    }

    if (enext >= eend) {
        if (enext === eend) {
            this.els.controlDown.addClass('disabled');
        }
        else {
            return false;
        }
    }
    else if (enext <= estart) {
        if (enext === estart) {
            this.els.controlUp.addClass('disabled');
        }
        else {
            return false;
        }
    }
    else {
        this.els.controls.filter('.disabled').removeClass('disabled');
    }
        
    return true;
};

// Utility functions
DatesPicker.prototype.dateToYMD = function(date) {
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
};
DatesPicker.prototype.YMDToDate = function(ymd) {
    var darr = ymd.split('-');
    return new Date(+darr[0], +darr[1] - 1, +darr[2]);
};
DatesPicker.prototype.YMDToDateMonth = function(ymd) {
    var darr = ymd.split('-');
    return new Date(+darr[0], +darr[1] - 1, 1);
};
DatesPicker.prototype.getWeeksNum = function(year, month) {
    var daysNum = this.getDaysNum(year, month),
        fDayO = new Date(year, month, 1).getDay(),
        fDay = fDayO ? (fDayO - 1) : 6,
        weeksNum = Math.ceil((daysNum + fDay) / 7);
    return weeksNum;
};
DatesPicker.prototype.getDaysNum = function(year, month) { // nMonth is 0 thru 11
    return 32 - new Date(year, month, 32).getDate();
};

// Behavior functions
DatesPicker.prototype.setActiveMonth = function(date) {
    var darr = this.dateToYMD(date).split('-');
    this.els.cells.filter('.active').removeClass('active');
    this.els.cells.filter('[data-date^="' + darr[0] + '-' + darr[1] + '"]').addClass('active');
};
DatesPicker.prototype.setMonthHeader = function(date) {
    this.els.monthHeader.html(this.monthLabels[date.getMonth()] + ' ' + date.getFullYear());
};
DatesPicker.prototype.getHolderHeight = function(date) {
    return this.cellHeight * this.getWeeksNum(date.getFullYear(), date.getMonth()) - 1;
};
DatesPicker.prototype.getCalendarPos = function(date) {
    return -((this.els.cells.filter('[data-date="' + this.dateToYMD(date) + '"]').index() / 7) | 0) * this.cellHeight;;
};
DatesPicker.prototype.animateCalendar = function(date) {
    var that = this,
        props = {};

    this.isAnimated = true;

    if (this.transform) {
        props[this.transform] = window.utils.translate(0, this.getCalendarPos(date) + 'px');
    }
    else {
        props['top'] = this.getCalendarPos(date);
    }
    
    this.els.dateList.animate(props, this.options.duration, 'ease-in', function() {
        that.isAnimated = false;
        that.els.datelistHolder.css({ height: that.getHolderHeight(date) });
    });
    
    $.pub('datespicker_scrolling', date);
};
DatesPicker.prototype.moveCalendar = function(date) {
    var props = {};

    if (this.transform) {
        props[this.transform] = window.utils.translate(0, this.getCalendarPos(date) + 'px');
    }
    else {
        props['top'] = this.getCalendarPos(date);
    }
    
    this.els.dateList.css(props);
    this.els.datelistHolder.css({ height: this.getHolderHeight(date) });
    
    $.pub('datespicker_moved', date);
};

DatesPicker.prototype.scrollCalendarTo = function(year, month, noAnimation) {
    var next = new Date(year, month);
    
    if (this.checkScrollability(next)) {
        this.setMonthHeader(next);
        this.setActiveMonth(next);
        
        noAnimation ? this.moveCalendar(next) : this.animateCalendar(next);

        this.dates.current = next;
    }
};
DatesPicker.prototype.sanitizeDates = function(date1, date2) {
    if (date1 > date2) {
        return [date2, date1];
    }
    else {
        return [date1, date2];
    }
};
DatesPicker.prototype.setDates = function(date1, date2) {
    var filtered = this.sanitizeDates(date1, date2);
    
    this.state.checkin = filtered[0];
    this.state.checkout = filtered[1];

    this.els.cells.filter('[data-date="' + this.state.checkin + '"]').addClass('checkin');
    this.els.cells.filter('[data-date="' + this.state.checkout + '"]').addClass('checkout');
    this.selectRange(this.state.checkin, this.state.checkout, 'selected');
};
DatesPicker.prototype.selectRange = function(ymd1, ymd2, selection_class) {
    var d1_arr = ymd1.split('-'),
        d2_arr = ymd2.split('-'),
        date1 = new Date(+d1_arr[0], +d1_arr[1] - 1, +d1_arr[2] - 1),// offset this so we can increment in while loop straight away
        date2 = +(new Date(+d2_arr[0], +d2_arr[1] - 1, +d2_arr[2])),
        curr_cell;

    this.els.cells.filter('.' + selection_class).removeClass(selection_class);
    while (+date1 < date2) {
        date1.setDate(date1.getDate() + 1);
        curr_cell = this.els.cells.filter('[data-date="' + this.dateToYMD(date1) + '"]').addClass(selection_class);
    };
};
