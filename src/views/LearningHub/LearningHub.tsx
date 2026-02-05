/*
 * Copyright (C)  Online-Go.com
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
import * as data from "@/lib/data";
import "./LearningHub.css";
import * as preferences from "@/lib/preferences";
import { Link, useParams } from "react-router-dom";
import { CardLink } from "@/components/material";
import { _, pgettext } from "@/lib/translate";
import { sections, all_sections } from "./sections";
import { Ribbon } from "@/components/misc-ui";
import { getSectionCompletion, getSectionByName } from "./util";
import { browserHistory } from "@/lib/ogsHistory";
import { MiniGoban } from "@/components/MiniGoban";
import { alert } from "@/lib/swal_config";

interface LearningHubParams {
    section: string;
    page: string;
}

export function LearningHub(): React.ReactElement {
    const params = useParams<keyof LearningHubParams>();

    React.useEffect(() => {
        const oldTitle = window.document.title;
        window.document.title = _("Learn to play Go");
        return () => {
            window.document.title = oldTitle;
        };
    }, [params.section, params.page]);

    const section_name = (params.section || "index").toLowerCase();
    let section: any = null;
    let next_section_name = "";

    for (let i = 0; i < all_sections.length; ++i) {
        if (all_sections[i].section() === section_name) {
            section = all_sections[i];
            if (i + 1 < all_sections.length) {
                next_section_name = all_sections[i + 1].section();
            }
        }
    }

    if (section) {
        const S = section;
        section = (
            <S
                page={params.page}
                nextSection={next_section_name}
                section={S.section()}
                title={S.title()}
                pages={S.pages()}
            />
        );
    }

    if (section) {
        return (
            <div id="LearningHub-container">
                <div id="LearningHub">
                    {section}
                    <SectionNav />
                </div>
            </div>
        );
    } else {
        return (
            <div id="LearningHub-container">
                <div id="LearningHub">
                    {" "}
                    <Index />{" "}
                </div>
            </div>
        );
    }
}

// Helper types for better maintainability
interface SectionProgress {
    total: number;
    completed: number;
    inProgress: number;
    percentage: number;
}

interface ExpandedSectionsState {
    [key: string]: boolean;
}

// Constants for preferences storage keys
const LAST_EXPANDED_SECTION_KEY = "learning-hub-expanded-section" as const;

// Helper functions extracted for reusability

// Calculates completion statistics for a section's lessons
function calculateSectionProgress(lessons: any[]): SectionProgress {
    const progress = lessons.reduce(
        (acc, lesson) => {
            const sc = getSectionCompletion(lesson.section());
            acc.total++;
            if (sc.completed) {
                acc.completed++;
            } else if (sc.started) {
                acc.inProgress++;
            }
            return acc;
        },
        { total: 0, completed: 0, inProgress: 0, percentage: 0 },
    );

    progress.percentage =
        progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
    return progress;
}

// Initializes section expansion state from saved preferences or defaults to first section
function initializeExpandedSections(): ExpandedSectionsState {
    const expandedSections: ExpandedSectionsState = {};
    const lastExpandedSection = preferences.get(LAST_EXPANDED_SECTION_KEY);

    sections.forEach(([sectionName], index) => {
        // Restore from saved state or default to first section
        expandedSections[sectionName] = lastExpandedSection
            ? sectionName === lastExpandedSection
            : index === 0;
    });

    return expandedSections;
}

// Returns the appropriate ribbon content based on lesson completion status
function getRibbonContent(sectionName: string): React.ReactNode {
    const sc = getSectionCompletion(sectionName);

    if (sc.completed) {
        return (
            <span>
                <i className="fa fa-star" />
                <i className="fa fa-star" />
                <i className="fa fa-star" />
            </span>
        );
    }

    if (sc.started) {
        return (
            <span>
                {sc.finished} / {sc.total}
            </span>
        );
    }

    return <span>{pgettext("Play a tutorial section", "play!")}</span>;
}

// Convert to functional component for better performance
function Index(): React.ReactElement {
    const user = data.get("user");
    const [expandedSections, setExpandedSections] = React.useState<ExpandedSectionsState>(
        initializeExpandedSections,
    );

    const toggleSection = React.useCallback((sectionName: string) => {
        setExpandedSections((prevState) => {
            // Accordion behavior: always keep exactly one section expanded.
            // If user clicks the currently expanded section, ignore the click.
            if (prevState[sectionName]) {
                return prevState;
            }

            // Collapse all sections except the clicked one
            const newState = Object.keys(prevState).reduce<ExpandedSectionsState>((acc, key) => {
                acc[key] = key === sectionName;
                return acc;
            }, {});

            preferences.set(LAST_EXPANDED_SECTION_KEY, sectionName);
            return newState;
        });
    }, []);

    return (
        <div id="LearningHub-Index">
            <div id="LearningHub-list">
                {sections.map(([sectionName, lessons]) => {
                    const isExpanded = expandedSections[sectionName];
                    const progress = calculateSectionProgress(lessons);
                    return (
                        <div key={sectionName} className="section">
                            <div
                                className="section-header clickable"
                                onClick={() => toggleSection(sectionName)}
                            >
                                <div className="section-left">
                                    <i
                                        className={`fa fa-chevron-${
                                            isExpanded ? "down" : "right"
                                        } section-chevron`}
                                    />
                                    <h2>
                                        <span className="section-number">
                                            {lessons[0].sectionIndex + 1}
                                        </span>
                                        {sectionName}
                                    </h2>
                                </div>
                                <div className="section-right">
                                    <div className="progress-info">
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${progress.percentage}%` }}
                                            />
                                        </div>
                                        <span className="lesson-count">
                                            {progress.completed}/{progress.total}{" "}
                                            {pgettext(
                                                "Tutorial - counter of learnt lessons",
                                                "lessons",
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className={`contents ${isExpanded ? "expanded" : "collapsed"}`}>
                                {isExpanded &&
                                    lessons.map((S) => {
                                        const className = getSectionClassName(S.section());
                                        const sectionNumber = `${S.sectionIndex + 1}.${
                                            S.lessonIndex + 1
                                        }`;
                                        // Extract MiniGoban configuration
                                        const DEFAULT_BOARD_SIZE = 9;
                                        const firstPage = new (S.pages()[0])();
                                        const pageConfig = firstPage.config();
                                        const {
                                            mode: _unused,
                                            move_tree: _unused2,
                                            ...baseConfig
                                        } = pageConfig;

                                        const config = {
                                            ...baseConfig,
                                            width: pageConfig.width || DEFAULT_BOARD_SIZE,
                                            height: pageConfig.height || DEFAULT_BOARD_SIZE,
                                        };

                                        return (
                                            <CardLink
                                                key={S.section()}
                                                className={className + " Ribboned"}
                                                to={`/learn-to-play-go/${S.section()}`}
                                            >
                                                <MiniGoban
                                                    noLink
                                                    game_id={undefined}
                                                    json={config}
                                                    displayWidth={64}
                                                    white={undefined}
                                                    black={undefined}
                                                />
                                                <div>
                                                    <h1>
                                                        <span className="lesson-number">
                                                            {sectionNumber}
                                                        </span>
                                                        {S.title()}
                                                    </h1>
                                                    <h3>{S.subtext()}</h3>
                                                </div>
                                                {className !== "todo" ? (
                                                    <Ribbon>{getRibbonContent(S.section())}</Ribbon>
                                                ) : null}
                                            </CardLink>
                                        );
                                    })}
                            </div>
                        </div>
                    );
                })}

                {/* What's next section */}
                <div className="section whats-next">
                    <div className="section-header">
                        <h2>
                            {pgettext(
                                "Tutorial - what's next after learning the game?",
                                "What's next?",
                            )}
                        </h2>
                    </div>
                    <div
                        className="contents"
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            flexWrap: "wrap",
                            alignItems: "center",
                            justifyContent: "space-around",
                        }}
                    >
                        {!user || user.anonymous ? (
                            <CardLink className={"done"} to={`/register`}>
                                <i className="fa fa-thumbs-up" />
                                <div>
                                    <h1>{pgettext("Sign up for an account", "Register")}</h1>
                                    <h3>{_("Get a free Online-Go account to play Go!")}</h3>
                                </div>
                            </CardLink>
                        ) : (
                            <CardLink className={"done"} to={`/play`}>
                                <i className="ogs-goban" />
                                <div>
                                    <h1>{_("Play Go!")}</h1>
                                    <h3>
                                        {_(
                                            "Play people from around the world, or against the computer",
                                        )}
                                    </h3>
                                </div>
                            </CardLink>
                        )}

                        <CardLink className={"done"} to={`/puzzles`}>
                            <i className="fa fa-puzzle-piece" />
                            <div>
                                <h1>{pgettext("Practice go by playing puzzles", "Puzzles")}</h1>
                                <h3>{_("Practice by solving Go puzzles")}</h3>
                            </div>
                        </CardLink>
                    </div>
                </div>

                {/* KidsGoServer.com link moved to bottom */}
                <div className="kids-go-server">
                    <img
                        src="https://cdn.online-go.com/assets/axol.svg"
                        alt="Kids Go Server mascot"
                    />
                    <div>
                        {pgettext(
                            "Immediately after this text is a link to Kids Go Server",
                            "Looking for a great place to learn Go for kids? Check out",
                        )}
                        <a href="https://kidsgoserver.com/">KidsGoServer.com</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper function for progress text in navigation
function getNavigationProgressText(sectionName: string): React.ReactNode {
    const sc = getSectionCompletion(sectionName);

    if (sc.completed) {
        return (
            <span className="progress-text">
                <i className="fa fa-star" />
            </span>
        );
    }
    if (sc.started) {
        return (
            <span className="progress-text">
                {sc.finished} / {sc.total}
            </span>
        );
    }

    return null;
}

// Convert to functional component for consistency and better performance
function SectionNav(): React.ReactElement {
    // Parse current section from URL
    const urlMatch = window.location.pathname.match(/\/learn-to-play-go(\/([^\/]+))?(\/([0-9]+))?/);
    const currentSectionName = urlMatch?.[2] || "";

    // Memoize reset progress handler
    const handleResetProgress = React.useCallback(() => {
        void alert
            .fire({
                text: _("Are you sure you wish to reset your tutorial progress?"),
                showCancelButton: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    data.removePrefix("learning-hub.");
                    browserHistory.push("/learn-to-play-go");
                }
            });
    }, []);

    return (
        <div className="LearningHub-section-nav">
            <Link to="/learn-to-play-go/">
                <i className="fa fa-graduation-cap" /> {pgettext("Learning hub menu", "Menu")}
            </Link>

            {sections.map((sectionArr) => {
                const [sectionTitle, lessons] = sectionArr;
                // Check if this section contains the currently active lesson
                const isActiveSection = lessons.some(
                    (lesson) => lesson.section() === currentSectionName,
                );

                return (
                    <div key={sectionTitle} className="section">
                        <Link to={`/learn-to-play-go/${lessons[0].section()}`}>
                            <h2>
                                <span className="section-number">
                                    {lessons[0].sectionIndex + 1}
                                </span>
                                {sectionTitle}
                            </h2>
                        </Link>
                        {isActiveSection &&
                            lessons.map((lesson) => {
                                const lessonNumber = `${lesson.sectionIndex + 1}.${
                                    lesson.lessonIndex + 1
                                }`;
                                const isCurrentLesson = lesson.section() === currentSectionName;

                                return (
                                    <Link
                                        key={lesson.section()}
                                        className={isCurrentLesson ? "active" : ""}
                                        to={`/learn-to-play-go/${lesson.section()}`}
                                    >
                                        <span className="lesson-number">{lessonNumber}</span>
                                        {lesson.title()}
                                        {getNavigationProgressText(lesson.section())}
                                    </Link>
                                );
                            })}
                    </div>
                );
            })}

            <span className="reset-progress" onClick={handleResetProgress}>
                {pgettext("Reset learning hub progress", "Reset progress")}
            </span>
        </div>
    );
}

function getSectionClassName(section_name: string): string {
    const sc = getSectionCompletion(section_name);

    const S = getSectionByName(section_name);
    if (S?.pages()[0].underConstruction()) {
        return "under-construction";
    }

    if (sc.completed) {
        return "done";
    }
    if (sc.started) {
        return "next";
    }
    if (sc.first) {
        return "next";
    }
    return "todo";
}
