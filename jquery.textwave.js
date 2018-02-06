/**
 * Distributed under GPLv3 license.
 * See http://www.gnu.org/licenses/gpl-3.0.en.html for more details.
 */
;
(function(factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function($) {
    var toolbox = {
        renders: {
            // If collission, returns enlargement ratio
            'zoom': function(MskIndx, MidVal, MskLoopIndx, ratio) { //  . x X x .
                return (MskLoopIndx == MidVal ? ratio : ratio * ((MidVal - Math.abs(MidVal - MskLoopIndx)) / MidVal))
            }
            // Further effects f(x) may be added here
        },
        play: function() {
            /**
            	Each frame is rendered as follows :
            		- The script loops over the letters captured in the elment content [lettersMap]
            				- On each loop, a mask [ somewhat like a array filled with ratios] moves on top of the String [ once again "lettersMap"]
            				=> this means : another loop that will test if the current letter index match to any of the current mask ratio
            				=> if true ... the letter is beiing applied the ratio
            	Ex :			[1][2][3][4][3][2][1] -->
            												[j][Q][u][e][r][y][ ][r][o][c][k][s][ ][!]
            			============ < ... 13 loops later over the mask ... it reaches the end of the String > =============
            																							[1][2][3][4][3][2][1] -->
            												 [j][Q][u][e][r][y][ ][r][o][c][k][s][ ][!]
            */
            var ref = this,
                $ref = $(this),
                data = $ref.data('textWaveData'),
                // for each letter in the letters map
                output = $.map(data.lettersMap,
                    // See if any ratio should be applied to the current letter
                    function(el, indx) {
                        var currentRatio = 1,
                            r = k = 0;
                        // loop over the mask
                        do {
                            // if any collision accurs between the current mask index and the current letter being processed
                            if ((data.maskIndex + k) == indx) {
                                // Get the ratio value
                                r = toolbox.renders.zoom(data.maskIndex, data.mskMidVal, k, data.ratio);
                            }
                            // Ratio r is not null : this means that a collision accured
                            if (r != 0) {
                                // Get the ratio value
                                currentRatio = r != 1 ? (((data.ratio - 1) * r) / data.ratio) + 1 : 1; //  EX if max ratio == 4   --->  (3x/4) + 1
                                break;
                            }
                        } while (++k < data.maskLen);
                        // return ('<span style="vertical-align:middle;position:relative;font-size:' + currentRatio + 'em">' + el + (data.maskIndex == indx ? '<span style="position:absolute;top:5px">&lt;|&gt;</span>' : '') + '</span>');
                        return (['<span style="vertical-align:middle;font-size:', currentRatio, 'em">', el, '</span>'].join(''));
                    }
                ).join('');

            /** Frame rendering */
            $ref.html(output);

            /** Whenever an extremis is reached */
            if ((data.maskIndex == data.lettersMap.length) ||
                (data.maskIndex == data.maskLen * -1)
            ) {
                if (!data.started)
                    data.started = true;
                else {
                    data.completedNb++;
                    data.way *= -1;
                }
            }
            /** Calculating the next mask index, saving and updating process data infos */
            data = $ref.data('textWaveData', $.extend(data, {
                maskIndex: (data.maskIndex + data.way)
            })).data('textWaveData');

            // Should the animation go on again ?
            if (!data['stop'] && (data.effect == -1 || (data.completedNb < data.effect))) {
                setTimeout(function() {
                    toolbox.play.apply(ref)
                }, data.framerate);
            } else {
                $ref.html($ref.text()).data('textWaveData', null);
            }
        }
    };

    $.fn.textWave = function(Opt) {
        var config = {
                'ratio': 2,
                'start': 'begin',
                'framerate': 42
            },
            effects = {
                'loop': -1,
                'custom': 2
            };

        if (Opt == 'stop') {
            return this.each(function() {
                $(this).data('textWaveData', $.extend($(this).data('textWaveData'), {
                    stop: true
                }));
            });
        }

        $.extend(config, Opt);
        return this.each(function(el, idx) {
            var $this = $(this),
                lettersMap = (config['text'] || ($this.text() ? $this.text() : 'undefined text')).split("");

            $this.css('line-height', (+($this.css('font-size').match(/^[\d.]+/).join('')) * config.ratio) + 'px');

            // Mask length has to be odd
            var maskLen = (lettersMap.length <= 1 ? 0 : (lettersMap.length >> 1) - ((lettersMap.length >> 1) % 2 == 0 ? 1 : 0)),
                startLeft = (config.start == 'begin' ? true : false);

            if ($this.data('textWaveData') || !maskLen) {
                return;
            }

            // Attaching current options to the node
            $this.data('textWaveData', {
                stop: false,
                started: false, // Start flag
                completedNb: 0, // Number of times "the mask" reached extremis
                maskLen: maskLen, // Mask len
                ratio: config.ratio, // Enlargement ratio
                mskMidVal: maskLen / 2, // Mask middle element's index
                lettersMap: lettersMap, // Split string against which the plugin will be applied
                way: (startLeft ? 1 : -1), // Mask moving way
                framerate: config.framerate, // rate of the animation
                maskIndex: (startLeft ? -1 * maskLen : lettersMap.length), // Mask index
                effect: ((config.repeat == 'loop') ? -1 : (!isNaN(Number(config.repeat)) ? Number(config.repeat) : 1))
            });

            toolbox.play.apply($this.get(0));
        });
    }
}));
