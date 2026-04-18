module.exports = {
	// BUG 2 FIX: Helper function to bypass Node.js locale issues and force OS Timezone
	formatTargetTime: function(timestamp) {
		const d = new Date(timestamp);
		const h24 = d.getHours();
		const m = d.getMinutes().toString().padStart(2, '0');
		const s = d.getSeconds().toString().padStart(2, '0');
		const h12 = h24 % 12 || 12;
		const ampm = h24 >= 12 ? 'PM' : 'AM';

		return {
			t24: `${h24.toString().padStart(2, '0')}:${m}:${s}`,
			t12: `${h12.toString().padStart(2, '0')}:${m}:${s} ${ampm}`
		};
	},

	startWatch: function (dir) {
		let self = this;

		self.clearTimer();

		// BUG 1 FIX: Memorize the direction so toggle knows how to resume
		self.lastDirection = dir;

		self.startingValue = new Date().getTime();
		if (dir === '-') {
			if (self.config && self.config['production-timer']) {
				self.watch = Math.ceil((self.watch + 1) / 1000) * 1000 - 1;
			}

			const targetTime = new Date(self.startingValue + self.watch);
			self.targetTime = targetTime.getTime();

			// BUG 2 FIX: Use the new local time formatter
			const times = self.formatTargetTime(self.targetTime);

			self.setVariableValues({
				target12_hms: times.t12,
				target24_hms: times.t24,
				isReverse: true,
			});
		} else {
			self.setVariableValues({
				target12_hms: '--:--:--',
				target24_hms: '--:--:--',
				isReverse: false,
			});
		}

		self.timer = setInterval(() => {
			let currentTime = new Date().getTime();

			let diff = currentTime - self.startingValue;

			if (dir === '-') {
				self.watch -= diff;
				if (
					(self.config && self.config['production-timer'] && self.watch < 1000) ||
					(!self.config?.['production-timer'] && self.watch <= 0)
				) {
					self.watch = 0;
					self.stopWatch();
				}
			} else {
				self.watch += diff;
			}

			self.startingValue = currentTime;

			self.checkVariables();
		}, self.precision);

		self.checkFeedbacks();
	},

	stopWatch: function () {
		let self = this;

		// BUG 1 FIX: We only clear the interval, we DO NOT call clearTimer()
		// This keeps isReverse and targetTime intact while paused!
		if (self.timer) {
			clearInterval(self.timer);
			delete self.timer;
		}

		self.checkVariables(); // Updates isRunning to false
		self.checkFeedbacks();
	},

	resetWatch: function () {
		let self = this;

		self.clearTimer();
		self.watch = 0;
		self.checkVariables();
		self.checkFeedbacks();
	},

	toggleWatch: function () {
		let self = this;

		if (self.timer) {
			self.stopWatch();
		} else {
			// BUG 1 FIX: Resume in the last known direction
			self.startWatch(self.lastDirection || '+');
		}
	},

	setWatch: function (hours, minutes, seconds) {
		let self = this;

		self.clearTimer();

		self.watch = (hours * 3600000) + (minutes * 60000) + (seconds * 1000);
		self.checkVariables();
	},

	addWatch: function (hours, minutes, seconds) {
		let self = this;

		const delta = (hours * 3600000) + (minutes * 60000) + (seconds * 1000);

		self.watch += delta;
		self.checkVariables();
		self.checkFeedbacks();

		if (typeof self.targetTime === 'number' && !isNaN(self.targetTime)) {
			self.targetTime += delta;
			const times = self.formatTargetTime(self.targetTime);
			self.setVariableValues({
				target12_hms: times.t12,
				target24_hms: times.t24,
			});
		}
	},

	subtractWatch: function (hours, minutes, seconds) {
		let self = this;

		const delta = (hours * 3600000) + (minutes * 60000) + (seconds * 1000);

		self.watch = Math.max(self.watch - delta, 0); // prevent negative timer
		self.checkVariables();
		self.checkFeedbacks();

		if (typeof self.targetTime === 'number' && !isNaN(self.targetTime)) {
			self.targetTime -= delta;
			const times = self.formatTargetTime(self.targetTime);
			self.setVariableValues({
				target12_hms: times.t12,
				target24_hms: times.t24,
			});
		}
	},

	clearTimer: function () {
		let self = this;

		if (self.timer) {
			clearInterval(self.timer);
			delete self.timer;
		}

		if (self.targetTime) {
			delete self.targetTime;
		}

		self.setVariableValues({
			target12_hms: '--:--:--',
			target24_hms: '--:--:--',
			isReverse: false,
		});

		self.checkFeedbacks();
	},
}