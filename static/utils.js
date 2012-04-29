window.utils = {};

window.utils.supports = (function() {
    var div = document.createElement('div'),
        vendors = 'Ms O Moz Webkit'.split(' '),
        len = vendors.length,
        succeeded,
        memo = {};

    return function(prop) {
        var key = prop;

        if (typeof memo[key] !== 'undefined') {
            return memo[key];
        }

        if (typeof div.style[prop] !== 'undefined') {
            memo[key] = prop;
            return memo[key];
        } 

        prop = prop.replace(/^[a-z]/, function(val) {
            return val.toUpperCase();
        });

        for (var i = len - 1; i >= 0; i--) {
            if (typeof div.style[vendors[i] + prop] !== 'undefined') {
                succeeded = '-' + vendors[i] + '-' + prop;
                memo[key] = succeeded.toLowerCase();
                return memo[key];
            }
        }

        return false;
    };
})();

window.utils.translate = function() {
    if ($.os.android) {
        var ver = /Android\s([\d\.]+)/g.exec(navigator.appVersion)[1];
        
        if (ver >= '4') {
            return function(x, y) {
                return 'translate3d(' + x + ', ' + y + ', 0)';
            }
        }
    }
    
    if (!$.os.ios) {
        return function(x, y) {
            return 'translate(' + x + ', ' + y + ')';
        };
    }
    else {
        return function(x, y) {
            return 'translate3d(' + x + ', ' + y + ', 0)';
        }
    }
}();

window.utils.e = function(e) {
    (typeof e.preventDefault !== 'undefined') && e.preventDefault();
    (typeof e.stopPropagation !== 'undefined') && e.stopPropagation();
};