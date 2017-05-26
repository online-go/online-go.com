/*
 * Copyright (C) 2012-2017  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from "react";
export let ChangeLog = (props) => (
<div id="docs-changelog">
    <dl>
        <dt><h2>2017-01-?? [5.0 (API: 47??; UI: 2??)]</h2></dt>
        <dd>
            v5.0 is by far our largest update to date and consists of multiple
            major refactoring and enhancement projects on both our backend and
            front end code bases. The result of this work provides OGS with a
            scalable server infrastructure capable of being deployed in a geographically
            diverse topology (which means the capability for providing faster, smoother, and more reliable access
            to OGS around the globe, neat!). After an initial migration and hardening period we'll
            begin utilizing these features and putting servers closer to our players.

            <h3>General Update</h3>
            <ul>
                <li>The game observation page now sorts games by combined rank of the players so higher ranked games are at the top of the list.</li>
                <li>Correspondence games are now browsable on the game observation page.</li>
                <li>The long standing game invalid game notification bug has finally been fixed for good</li>
                <li>The long standing infamous tablet stone placement bug has finally been fixed for good</li>
                <li>The generic user icon has been replaced with a unique icon
                    per user. This can still be overridden to a user supplied icon using
                    either Gravatar or uploading an icon on the settings page.
                </li>
                <li>The game pattern searching functionality has been removed
                    until we can figure out how to implement it more effeciently
                    and provide more useful results</li>
            </ul>
            <h3>Server Side</h3>
            <ul>
                <li>
                    Refactored real-time server code base to operate in a simpler, faster, sharded
                    topology as opposed to the slower and problematic clustering topology
                    we had before.
                </li>
                <li>
                    Brought all libraries used on both the Django and Node code bases up to date.
                </li>
                <li>
                    Implemented several database and API optimizations to address various slowdown issues
                </li>
            </ul>
            <h3>User Interface</h3>
            <ul>
                <li>Ported the user interface from Angular 1.4 to React 15, resulting in a much more performant interface</li>
                <li>Greatly improved the cachability of large assets and
                    greatly reduced the amount size of data needed to be downloaded
                    for page loads, this should help a lot when accessing the site
                    on mobile devices and slower links, as well as speeding things up for
                    desktop use.
                </li>
                <li>Ported the code base from plain JavaScript to TypeScript</li>
                <li>Lots of minor interface updates and tweaks</li>
            </ul>
        </dd>

        <dt><h2>2015-10-04 [4.3-20 (4176)]</h2></dt>
        <dd>
        <ul>
            <li>Games can now be reviewed while they are ongoing.</li>
            <li>Review SGFs can now be downloaded with "official"
                comentary only. Chat messages from users that have voice or
                board control are considered official.</li>
            <li>
            The underlying format for game moves has been altered to
            enable per-move timestamps and other meta data for future
            features such as Rengo.
            </li>
        </ul>
        </dd>

        <dt><h2>2015-08-23 [4.2-664 (4154)]</h2></dt>
        <dd>
        <ul>
            <li>Voice server improvements, connections should now only take a second to link up and large broadcasts should run a lot smoother.</li>
        </ul>
        </dd>

        <dt><h2>2015-08-10 [4.2-636 (4126)]</h2></dt>
        <dd>
        <ul>
            <li>Added per-game volume controls</li>
            <li>Added per-game board label</li>
            <li>Byo-yomi count down happens on each period now instead of 3 beeps for all but the last period</li>
            <li>Updated the player and clock look on the games page to be clearer, hopefully</li>
            <li>Byo-yomi periods are counted down like other servers now so a display of 1 period left means you're on your last period.</li>
            <li>Added italian as a supported language (Thanks ema!)</li>
            <li>Fixed challenge accept/create bug where you sometimes had to clear your cookies</li>
        </ul>
        </dd>
        <dt><h2>2015-05-31 [4.2-544 (4034)]</h2></dt>
        <dd>
        <ul>
            <li>Fixed notable scoring bug which caused some removed stones to not be counted as territory</li>
        </ul>
        </dd>
        <dt><h2>2015-05-24 [4.2-524 (4014)]</h2></dt>
        <dd>
        <ul>
            <li>Improved (hopefully) the auto-scoring system significantly. Users no longer have to seal borders for the game to autoscore correctly.</li>
            <li>Improved (hopefully) the score estimation significantly</li>
            <li>Bot games are now autoscored</li>
            <li>You can now block people from accepting your games or sending you challenges (click the users' name then the circle with a slash through it)</li>
            <li>Hopefully fixed issue which prevented some usres from challenging others or creating the open challenge creation dialog box</li>
            <li>Fixed issue which sometimes caused up to seconds of lag</li>
            <li>Fixed missing chat userlist on IE</li>
        </ul>
        </dd>
        <dt><h2>2015-03-22 [4.2-493 (3983)]</h2></dt>
        <dd>
        <ul>
            <li>Fixed voice chat</li>
            <li>Added support for multiple speakers in voice chat. Review owners can now click a name from the user list and click 'Give voice' to let them join the voice broadcast.</li>
            <li>Fixed bug where review viewers got out of sync sometimes</li>
        </ul>
        </dd>
        <dt><h2>2015-02-02 [4.2-457 (3947)]</h2></dt>
        <dd>
        <ul>
            <li>Fixed AGA scoring when handicaps are involved</li>
            <li>Added a timeout for the stone removal phase</li>
        </ul>
        </dd>
        <dt><h2>2015-01-30 [4.2-441 (3931)]</h2></dt>
        <dd>
        <ul>
            <li>Better support for p ranks</li>
            <li>Added 'call moderator' buttons to report games, users, and reviews</li>
            <li>Upped delay between changes in the stone removal phase and the time which the "Accept removed stones" button becomes activeated from 0.5s to 1.5s on desktops and 4s on mobile and tablet devies.</li>
        </ul>
        </dd>

        <dt><h2>2015-01-21 [4.2-430 (3920)]</h2></dt>
        <dd>
        <ul>
            <li>Moved hourly tournament notification into a tournament icon in the main nav bar</li>
            <li>Changed challenge time control selection to be fixed dropdowns instead of the error prone free input fields</li>
            <li>Lots of bug fixes</li>
        </ul>
        </dd>


        <dt><h2>2014-12-28 [4.2-377 (3867)]</h2></dt>
        <dd>
        <ul>
            <li>Bots should be working again, let us know if you have any issues</li>
            <li><a href="http://ogs.uservoice.com/forums/277766-online-go-com-suggestions-and-feature-requests/suggestions/6857461-ogs-menu-please-give-my-old-friendlist-back">Friends list is now available from the nav bar, along with a quick count indicator to see how many are online</a></li>
            <li><a href="http://ogs.uservoice.com/forums/277766-online-go-com-suggestions-and-feature-requests/suggestions/6884220-add-a-thai-channel-for-thai-players">Added Thai channel</a></li>
            <li><a href="http://ogs.uservoice.com/forums/277766-online-go-com-suggestions-and-feature-requests/suggestions/6840659-make-the-resign-button-better-visible">Moved resign button to be more front and center</a></li>
        </ul>
        </dd>



        <dt><h2>2014-12-17 [4.2-325 (3815)]</h2></dt>
        <dd>
            <h4>Tournament related changes</h4>
            <ul>
                <li>Added two new tournament types, single elimination and
                double elimination</li>
                <li>Tournament pairing methods are now configurable with
                options being slaughter, strength, slide, and random pairing.
                Optionally, the first round may have a different pairing
                method than the subsequent rounds.</li>
                <li>Tournaments will now automatically start at a time specified by the tournament director, providing the minimum player count has been met (also specified by the tournament director)</li>
                <li>Optionally, tournaments can start when the tournament is full as well</li>
                <li>Players who are not on in the tournament lobby (either on the tournament page or in chat) when
                a live tournament begins will be automatically dropped from the tournament</li>
                <li>OGS now has automatically created site-wide tournaments and will be scheduling
                a variety of very regular blitz, live, and correspondence tournaments.</li>
                <li>A new <b>leaderboards</b> page has been added which ranks all tournament
                players on the server based on their performance.</li>
            </ul>
            <h4>Rating &amp; ranking changes</h4>
            <ul>
                <li>Your rating and ranking is now tracked separately for blitz, live, correspondence, and overall.</li>
            </ul>
            <h4>UI Changes</h4>
            <ul>
                <li>All connections to the server will now be running over https. There are many benefits to this in terms of security and connection stability, however one slightly negative side effect is that you may need to update any per-browser settings (such as your move preferences, board themes, etc). If you aren't already, you can begin using the secure version of the site now at <a href="https://online-go.com/">https://online-go.com/</a> to get your settings all setup before the update to ensure you are not caught unawares</li>
                <li>We have documentation! <a href="http://ogs.readme.io/">http://ogs.readme.io/</a></li>
                <li>The site has been re-skinned a bit. If you have any problems finding
                anything check out the site documentation.</li>
                <li>A new omni-search box has been added. This can be used to find users, groups, tournaments, various site topics,
                and hopefully more in the future. This has replaced the generic players search screen.</li>
                <li>You can view a your win/loss statistics vs a particular player by viewing their profile page</li>
            </ul>
            <h4>Teaching tools</h4>
            <ul>
                <li>Private games and private reviews are now supported. Once created access can be granted to additional users or to entire groups by clicking the <i className="fa fa-lock"></i> icon</li>
                <li>Voice chat has been added (again) for reviews. Viewers will automatically connect into the voice system and can disconnect by clicking the <i className="fa fa-volume-up"></i> button. Review creators can begin broadcasting clicking the <i className="fa fa-microphone"></i> button. <i>Note: this feature is only available on browsers that support WebRTC, which is only Chrome and Firefox for the time being</i> </li>
                <li>Full-screen mode has been improved for presentations / videos</li>
            </ul>
            <h4>Chat changes</h4>
            <ul>
                <li>The chat subsystem has been replaced; joining channels should be much faster and chat should be more reliable</li>
                <li>Once closed, private messages will no longer come back to haunt other browsers you may use.</li>
                <li>Private message chat history is no longer limited to 50
                lines total, and is instead limited to 50 lines per player
                but will be automatically purged after a few days of not
                chatting with that user.</li>
                <li>Private chat windows are now movable (open them up, drag around the title)</li>
                <li>You can now see the online status of the person you are chatting with, as well as open their profile and challenge them directly from the chat window</li>
            </ul>
            <h4>API Changes</h4>
            <ul>
                <li>The real-time API is now stabilized sufficiently and
                we're opening it up for anyone wishing to make an
                alternative game client or otherwise use the system. Documentation is here:
                <a href="http://ogs.readme.io/v4.2/docs/real-time-api">http://ogs.readme.io/v4.2/docs/real-time-api</a>

                <i>Note: While the API is free for light non-commercial use, please contact
                    us if you are planning on using it for commercial purposes so we can
                    work together to form a mutually beneficial agreement. For heavy non-commercial use
                    please contact us so we can ensure the system can adequately handle the load or
                    help figure out an alternative solution.
                </i>
                </li>
            </ul>
            <h4>Challenge behavior changes</h4>
            <ul>
                <li>
                Users can no longer accept open challenges from other
                players if they are already playing a game against them.
                (Multiple direct challenges are still allowed.)
                </li>
                <li>Users with less than 500 games completed can no longer
                accept multiple open live games at the same time.  </li>
                <li>If you cancel a game after accepting an open challenge
                you will now need to wait for a couple of minutes before
                accepting a new open challenge.</li>
            </ul>
            <h4>Supporting OGS</h4>
            <ul>
                <li>Users can now support OGS using Bitcoin</li>
                <li>Sadly, google is shutting down their google wallet purchase system, so we have to remove this support mechanism. The system will still work for supporters using this mechanism until early Q2 2015, afterwhich it will be shutdown for good. Anyone wishing to continue to support us will have to transition to a different system before then (simply cancel your OGS google wallet subscription on your wallet page then head on over to OGS and select the new support method of your choice :))</li>
            </ul>
        </dd>

        <dt><h2>2014-10-05 [4.1-256 (3423)]</h2></dt>
        <dd>
            <ul>
                <li> Tsumego are now (optionally) randomly flipped, transposed, and color inverted </li>
                <li> Tsumego are now (optionally) displayed zoomed into the applicable region </li>
                <li> Added view, solution, and attempt counting for Tsumego (graphs and stats coming next!) </li>
            </ul>
        </dd>

        <dt><h2>2014-09-23 [4.1-222 (3389)]</h2></dt>
        <dd>
            <ul>
                <li> Fixed middle-click and command-click for player info and move counter buttons.  </li>
                <li> Players will now be prompted to resign when leaving live game windows </li>
                <li> Before accepting open games, the accepting player will now be presented with an accept dialog to confirm the settings that they are accepting </li>
                <li> When creating a tsumego, you may now restrict players movements to only follow paths you've created. </li>
                <li> When creating a tsumego, you may now force players to play as the opponent color instead of the opponent color automatically moving </li>
                <li> SGF markings (shapes and labels) now import and export correctly. You will not need to re-upload any SGFs with markings, they should just start working now. </li>
                <li> Fixed a bad setting which caused search problems for strings (usernames etc) containing utf8 characters and numbers </li>
                <li> Guests may now enter the chat room again </li>
            </ul>
        </dd>

        <dt><h2>2014-09-10 [4.1-162 (3329)]</h2></dt>
        <dd>
        <ul>
            <li>Added a tutorial for learning the very basics of the game, hopefully a good starting place for brand new players - feedback welcome!</li>
            <li>Added tsumego creation and playing system</li>
            <li>
                Renamed the 'SGF Collections' to 'My Library', updated the interface significantly.
            </li>
            <li>
                You may now view other peoples 'Personal Libraries' through a link on their profile.
            </li>
            <li>
                You may now make private collections within your library, entries within these will
                not be visible to others.
            </li>
            <li>
                Desktop notifications now fade away after 10 seconds by default. (You can change this under settings)
            </li>
        </ul>
        </dd>

        <dt><h2>2014-08-03 [4.0-773 (3102)]</h2></dt>
        <dd>
        <ul>
            <li>Arrow tree shortcuts in move trees have been adjusted: left/right will always follow the same branch, up/down will now work accross deep branches but will not jump around if there is nothing above or below the current node.</li>
            <li>You may now search by reviewer in the Library, this
            works for demo boards as well as game reviews, so can be
            used to look at all of the demo boards you've created.
            (We're still planning on building out a more inclusive
            interface for handling that, but this method can be used in
            the meantime.)</li>
        </ul>
        </dd>

        <dt><h2>2014-08-02 [4.0-751 (3080)]</h2></dt>
        <dd>
        <ul>
            <li>You can now adjust the volume of the stone placement sounds and countdown voice</li>
            <li>You can now click on 'Your Move' desktop notifications and they will bring you to the game</li>
            <li>Theoretically the ghost sound issues should be fixed with this patch, let us know if you hear anything odd :)</li>
            <li>Swedish and Finnish language support has been added (Thanks Cab, Oni, Pempu, Eskil, and ztanz!)</li>
        </ul>
        </dd>

        <dt><h2><i>2014-07-27 [4.0-722 (3051)]</i></h2></dt>
        <dd>
        <ul>
            <li>Big rating adjustment as well some updates to our rating algorithm, see <a
                href="http://forums.online-go.com/t/upcoming-rating-correction-and-changes/1048/51">http://forums.online-go.com/t/upcoming-rating-correction-and-changes/1048/51</a>
                for details. <b>Your rank probably jumped up with this patch if you were less than 5k, this is expected.</b></li>
            <li>Timing out of a correspondence game will now bar you
            from entering future correspondence tournaments or
            participating in correspondence ladders until you have
            completed a correspondence game that lasts for two or more
            days.</li>
            <li>Number of load time improvements have been made which
            affect tablets and phones the most. (Load times still
            aren't all that great, but better than they were!)</li>
            <li>SGF import bug fixed which caused results to not be
            parsed correctly. If you want an SGF to be searchable based
            upon the outcome of the game, you will have to re-upload
            those SGFs</li>
            <li>Horizontal scrolling has been fixed on android and ios,
            however this comes at the expense of losing the swipe
            access of the left menu bar. Complain if you miss this
            feature, though we're not sure how to solve for both use
            cases at the moment, if enough people miss it we'll try and
            figure out something though.</li>
        </ul>
        </dd>

        <dt><h2><i>2014-07-08 [4.0-615 (2944)]</i></h2></dt>
        <dd>
        <ul>
            <li>Just a lot of bug fixes.</li>
        </ul>
        </dd>


        <dt><h2><i>2014-06-28 [4.0-534 (2862)]</i></h2></dt>
        <dd>
        <ul>
            <li>Saying ##ID  in chat will now link to a review or demo board</li>
            <li>Pressing the "`" or "§" key will now expand or collapse the left nav menu</li>
            <li>Variations on demo boards will now auto-number moves in a "smart" fashion, let us know how it works in practice</li>
            <li>New "Auto-Play" feature is available when viewing games. If you start from an old move and hit "play", it will
            slowly progress through the game (one move every 10 seconds.)</li>
            <li>Hopefully fixed the "Yin-Yang" stone bug that plagued us for over a year - let me know if you see it again.</li>
            <li>Handicap and komi information will now be displayed in open challenge requests in the chat</li>
            <li>Several iOS fixes and Safari fixes and improvements</li>
            <li>Over 50 other bug fixes</li>
        </ul>
        </dd>


        <dt><h2><i>2014-06-22 [4.0 (2761)]</i></h2></dt>
        <dd>
            <ul>
                <li>
                Overhauled system to be completely API driven, any developers interested in
                interfacing with OGS should begin with the developers link in the left nav.
                </li>

                <li>
                Overhauled the user interface, this should result in a notable bandwidth
                reduction, faster page loading times, and a more modern look and feel.
                </li>

                <li>
                The forums have been transitioned to a discourse
                system, a much better software platform than the old
                forums
                </li>

                <li>
                The library system has been overhauled and greatly improved, you can now
                search for game records based on a number of criteria, including board patterns.
                This applies to both games played on the server and uploaded SGFs.
                </li>

                <li>
                The browse game functionality has been merged into the My Games (home screen / overview screen)
                to make it quicker to find matches
                </li>

                <li>
                Game and demo board sizes can now have custom sizes ranging anywhere from 1 to 25
                per dimension.
                </li>
            </ul>
        </dd>
    </dl>
</div>

);
