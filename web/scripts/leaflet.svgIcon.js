L.ObjectIcon = L.Icon.extend({
	options: {
		// @section
		// @aka objectIcon options
		iconSize: [16, 16], // also can be set through CSS
		iconUrl: '',
		className: 'leaflet-object-icon'
	},

	createIcon: function (oldIcon) {
		var object = (oldIcon && oldIcon.tagName === 'OBJECT') ? oldIcon : document.createElement('object'),
		    options = this.options;

		object.data = options.iconUrl;
		object.type = "image/svg+xml";

		this._setIconStyles(object, 'icon');

		return object;
	},

	createShadow: function () {
		return null;
	}
});

// @factory L.objectIcon(options: objectIcon options)
// Creates a `objectIcon` instance with the given options.
L.objectIcon = function (options) {
	return new L.ObjectIcon(options);
};