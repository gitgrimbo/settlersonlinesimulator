;
try {
	(function($) {
		/* http://settlersonlinesimulator.com/dso_kampfsimulator/en/adventures/die-schwarzen-priester/ */

		// Page already includes:
		//   jQuery 1.6.2
		//     This means we use 'delegate' and not 'on'.



		// Util



		var NODE_TEXT = 3;

		function forEachOwnProperty(ob, fn, context) {
			for (var i in ob) {
				if (ob.hasOwnProperty(i)) {
					fn.call(context, ob, i);
				}
			}
		}

		/**
		 * Outputs the hasOwnProperty name/values of "this".
		 */
		function simpleToString() {
			var arr = [];
			forEachOwnProperty(this, function(ob, prop) {
				arr.push(prop + ": " + this[prop]);
			}, this);
			if (arr.length > 0) {
				return arr.join(", ");
			}
			return "";
		}

		function $trim(el) {
			var str = null;
			if ("string" === typeof el) {
				str = el;
			} else if (NODE_TEXT === el.nodeType) {
				str = el.nodeValue;
			} else {
				// assume a jQuery object or DOM element
				str = $(el).html();
			}
			str = str.replace(/<br>/gi, "\n");
			return $.trim(str);
		}



		// UnitList



		/**
		 * Constructs a new UnitList, 'cloned' from "unitList" if provided.
		 */
		function UnitList(unitList) {
			if (unitList) {
				forEachOwnProperty(unitList, function(ob, prop) {
					this[prop] = unitList[prop];
				}, this);
			}
		};

		/**
		 * @return a new UnitList.
		 */
		UnitList.prototype.add = function(unitList) {
			var res = new UnitList(this);
			forEachOwnProperty(unitList, function(ob, prop) {
				var val = unitList[prop];
				res[prop] = this.hasOwnProperty(prop) ? res[prop] + val : val;
			}, this);
			return res;
		};

		/**
		 * @return a new UnitList.
		 */
		UnitList.prototype.subtract = function(unitList) {
			var res = new UnitList(this);
			forEachOwnProperty(unitList, function(ob, prop) {
				var val = unitList[prop];
				res[prop] = this.hasOwnProperty(prop) ? res[prop] - val : -val;
			}, this);
			return res;
		};

		/**
		 * Ensure that the returned UnitList has enough units to satisfy the
		 * "recruitmentUnitList" unit requirements. I.e., the returned UnitList may be
		 * exactly the same as "this" if there are enough units to satisfy
		 * "recruitmentUnitList".
		 *
		 * @return a new UnitList.
		 */
		UnitList.prototype.recruit = function(recruitmentUnitList) {
			var res = new UnitList(this);
			forEachOwnProperty(recruitmentUnitList, function(ob, prop) {
				var val = recruitmentUnitList[prop];
				res[prop] = this.hasOwnProperty(prop) ? Math.max(val, this[prop]) : val;
			}, this);
			return res;
		};

		UnitList.prototype.toString = simpleToString;



		// SimTable
		// Utility operations to perform on a sim table DOM element.



		function SimTable($simTable) {
			this.$simTable = $simTable;
		}

		SimTable.parseUnitsStr = function(str) {
			var units = new UnitList();

			if (!str) {
				return units;
			}

			// remove attack wave prefix, e.g. "1: "
			var match = str.match(/.*?\:(.*)/);
			if (match) {
				str = $trim(match[1]);
			}

			str = str.split(/\s+/);
			for (var i = 0; i < str.length; i++) {
				var match = str[i].match(/([\d.]+)(.*)/);
				units[match[2]] = parseFloat(match[1]);
			}
			return units;
		};

		SimTable.parseToSim = function($simTable) {
			function parseEnemiesFromHeader(sim, $h) {
				/*
      <h3 id="camp-58">
    10<span title="Thug (SL)" class="bandit_militia" style="display:inline;padding:2px 12px 2px 11px;">&#160;</span> 15<span title="Stone Thrower (SW)" class="bandit_bowman" style="display:inline;padding:2px 12px 2px 11px;">&#160;</span>    <span class="small-8">
      <a href="#optimised-army-proposals-unit-filter" onclick="document.getElementById('filter').action='#camp-58'"><span class="normal">(#filter)</span></a>
    </span>
    <span class="camp-ep">
      <span title="Experience">&#160;</span>
      75    </span>
  </h3>
*/
				var children = $h.children("span");
				sim.enemies = [];
				// -2 because the filter and experience <span>s are not enemies
				for (var i = 0; i < children.length - 2; i++) {
					var span = children[i];
					var enemy = {};
					enemy.count = $trim(span.previousSibling);
					enemy.type = $.trim($(span).attr("title"));
					sim.enemies.push(enemy);
				}
				var expStr = $trim(children.last().text());
				sim.exp = parseInt(expStr);
			}

			function parseUnitsRequiredFromRow(tr) {
				/*
<tr><td>1: 134B<br />2: 23R 1S 44C 132LB</td><td>134B 1G<br />22.26R</td><td>134B 1G<br />23R</td><td>40KU 40SS 24DP<br />16DP 1DHP</td><td>40KU 40SS 40DP<br />16DP 1DHP</td><td>162.75</td></tr><tr><td>1: 135B<br />2: 23R 1S 44C 132LB</td><td>135B 1G<br />22.26R</td><td>135B 1G<br />23R</td><td>40KU 40SS 24DP<br />16DP 1DHP</td><td>40KU 40SS 40DP<br />16DP 1DHP</td><td>163.75</td></tr><tr><td>1: 136B<br />2: 23R 1S 44C 132LB</td><td>136B 1G<br />22.27R</td><td>136B 1G<br />23R</td><td>40KU 40SS 27DP<br />13DP 1DHP</td><td>40KU 40SS 40DP<br />13DP 1DHP</td><td>164.75</td></tr>
*/
				var $td = $(tr).find("td");
				if (!$td || $td.length < 1) {
					console.log("parseSimTable: tds not found");
					return null;
				}

				// create some info objects that pair a stats header with its text as lines
				var unitInfo = $.map(["units", "avgLoss", "maxLoss", "minKill", "maxKill"], function(prop, i) {
					return {
						prop: prop,
						lines: $trim($td.eq(i)).split("\n")
					};
				});

				var waves = [];
				var numWaves = unitInfo[0].lines.length;
				for (var i = 0; i < numWaves; i++) {
					var option = {};
					for (var j = 0; j < unitInfo.length; j++) {
						option[unitInfo[j].prop] = SimTable.parseUnitsStr(unitInfo[j].lines[i]);
					}
					waves.push(option);
				}

				if (waves.length < 1) {
					var e = new Error("No waves found");
					e.tr = tr;
					throw e;
				}

				return waves;
			}

			var sim = {};
			var $h = SimTable.getSimHeader($simTable);
			parseEnemiesFromHeader(sim, $h);
			sim.options = [];
			$simTable.find("tr").each(function(i, tr) {
				//console.log(i, tr);
				if (0 === i) {
					return;
				}
				var option = parseUnitsRequiredFromRow(tr);
				if (option) {
					sim.options.push(option);
				}
			});

			if (sim.options.length < 1) {
				var e = new Error("No options found");
				e.table = $simTable[0];
				throw e;
			}

			//console.log(sim);
			return sim;
		};

		SimTable.getSimHeader = function($simTable) {
			return $simTable.prev("h3");
		};

		SimTable.isIgnored = function($simTable) {
			var $h = SimTable.getSimHeader($simTable);
			return !$h.find("input.include-sim").is(":checked");
		};

		SimTable.showTableAndHeader = function($simTable, isShow) {
			isShow = ("undefined" === typeof isShow) || (true === isShow);
			var $h = SimTable.getSimHeader($simTable);
			(isShow) ? $h.show() : $h.hide();
			(isShow) ? $simTable.show() : $simTable.hide();
		};

		SimTable.hideTableAndHeader = function($simTable) {
			SimTable.showTableAndHeader($simTable, false);
		};

		SimTable.getChosenAttackOption = function($simTable) {
			var $sel = $simTable.find("tr.attack-option.selected");
			if ($sel.length < 1) {
				return -1;
			}
			var idx = $sel.attr("data-attack-option-index");
			return parseInt(idx, 10);
		};

		SimTable.addAttackOptionClasses = function($simTable) {
			$simTable.find("tbody").each(function(i, tbody) {
				$(tbody).find("tr").each(function(i, tr) {
					var $tr = $(tr);
					$tr.addClass("grimbo attack-option");
					$tr.attr("data-attack-option-index", i);
				});
			});
		};

		SimTable.addSummaryRows = function($simTable, thisWaveLosses, totalLosses, totalActive, totalXP) {
			var $tr1 = $("<tr class='grimbo summary wave-losses' />").html("<td>Wave losses:</td><td colspan=99>" + thisWaveLosses + "</td>");
			var $tr2 = $("<tr class='grimbo summary total-losses' />").html("<td>Total losses:</td><td colspan=99>" + totalLosses + "</td>");
			var $tr3 = $("<tr class='grimbo summary total-required' />").html("<td>Total required:</td><td colspan=99>" + totalActive.add(totalLosses) + "</td>");
			var $tr4 = $("<tr class='grimbo summary total-exp' />").html("<td>Total XP:</td><td colspan=99>" + totalXP + "</td>");
			var $trs = $tr1.add($tr2).add($tr3).add($tr4).css("border", "solid black 1px");
			$simTable.append($trs);
		};

		SimTable.removeSummaryRows = function($simTable) {
			$simTable.find("tr.grimbo.summary").remove();
		};

		// Create 'instance' methods for each of the specified 'static' methods.
		// All the 'static' methods take $simTable as the first parameter.
		$.each(["parseToSim", "parseSimTable", "getSimHeader", "isIgnored", "showTableAndHeader", "hideTableAndHeader", "getChosenAttackOption", "addSummaryRows", "removeSummaryRows"], function(i, methodName) {
			SimTable.prototype[methodName] = function() {
				var meth = SimTable[methodName];
				var args = [this.$simTable].concat(Array.prototype.slice.call(arguments));
				// null === no execution context as this method is 'static'.
				return meth.apply(null, args);
			};
		});




		// Main



		(function(simTables) {

			function doCalcs() {
				var sims = [];
				var totalLosses = new UnitList();
				var totalActive = new UnitList();
				var totalXP = 0;

				simTables.each(function(i, table) {
					var $table = $(table);

					var simTable = new SimTable($table);

					// hide by default
					simTable.hideTableAndHeader();

					// clear previous summary rows (if any)
					simTable.removeSummaryRows();

					if (simTable.isIgnored()) {
						return;
					}

					simTable.showTableAndHeader();

					var sim = simTable.parseToSim();
					sims.push(sim);

					var chosenAttackOption = simTable.getChosenAttackOption();
					chosenAttackOption = Math.max(chosenAttackOption, 0);
					//console.log("sim", i, "chosenAttackOption", chosenAttackOption);

					var option1waves = sim.options[chosenAttackOption];
					var thisWaveLosses = new UnitList();
					for (var i = 0; i < option1waves.length; i++) {
						var wave = option1waves[i];
						// add this wave losses
						thisWaveLosses = thisWaveLosses.add(wave.maxLoss);
						// recruit enough units for this wave (may already have them active)
						totalActive = totalActive.recruit(wave.units);
						// the dead are not active any more!
						totalActive = totalActive.subtract(wave.maxLoss);
					}

					totalLosses = totalLosses.add(thisWaveLosses);
					totalXP += sim.exp;

					simTable.addSummaryRows(thisWaveLosses, totalLosses, totalActive, totalXP);
				});

				console.log(sims);
			}

			function addSimControls() {
				simTables.each(function(i, table) {
					var $h = SimTable.getSimHeader($(table));
					var $checkbox = $("<input id=ignore_sim_" + i + " type=checkbox class='grimbo include-sim' data-sim-index=" + i + " checked=checked title='Ignore this'></input>");
					$h.prepend($checkbox);
					var $button = $("<button class='grimbo ignore-prev-sims' data-sim-index=" + i + " title='Ignore all previous'>&uarr;</button>");
					$h.prepend($button);
				});
			}

			function addAttackOptionClasses() {
				simTables.each(function(i, table) {
					SimTable.addAttackOptionClasses($(table));
				});
			}

			function addStyles(addTo) {
				addTo = addTo || document.body;
				var $style = $("<style/>").html("tr.grimbo.attack-option.selected { border-left: solid red 4px; }");
				$(addTo).append($style);
			}

			// Ignore-sim checkbox click
			$(document).delegate("input.include-sim", "click", function(evt) {
				doCalcs();
			});

			// Ignore-prev-sims button click
			$(document).delegate("button.ignore-prev-sims", "click", function(evt) {
				var $button = $(this);
				var idx = parseInt($button.attr("data-sim-index"), 10);
				for (var i = 0; i < idx; i++) {
					$("#ignore_sim_" + i)[0].checked = false;
				}
				doCalcs();
			});

			// Choose attack option
			$(simTables).delegate("tr.grimbo.attack-option", "click", function(evt) {
				var $tr = $(this);
				$tr.siblings().add($tr).removeClass("selected");
				$tr.addClass("selected");

				// a bit inefficient to do all the calcs again?
				doCalcs();
			});

			addStyles();
			addAttackOptionClasses();
			addSimControls();
			doCalcs();

		}($("table.example-sim")));

	}(jQuery));
} catch (e) {
	console.log(e);
}