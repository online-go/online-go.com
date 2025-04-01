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
import "./RatingsChartDistribution.styl";
import * as React from "react";
import { ResponsiveLine } from "@nivo/line";
import { _, interpolate, pgettext, gettext } from "@/lib/translate";
import { rating_to_rank, boundedRankString } from "@/lib/rank_utils";

interface RatingsChartDistributionProps {
    myRating?: number;
    otherRating?: number;
    otherPlayerName?: string;
    showRatings: boolean;
}

interface RatingHistogramResponse {
    last_updated: string;
    status: string;
    mean_rating: number;
    freq: number[];
    ratings: number[];
    min_rating: number;
    max_rating: number;
    bin_size: number;
    max_deviation: number;
    samples: number;
}

const chartLabel = {
    cumulative: gettext("Cumulative"),
    players: gettext("Players"),
    yourRating: gettext("Your Rating"),
    rating: gettext("Rating"),
    rank: gettext("Rank"),
};

const line1Color = "#7798BF";
const line2Color = "hsl(43, 70%, 50%)";
const line3Color = "#FF5733";

const getColoredAxis = (color: string) => {
    return {
        axis: {
            ticks: {
                line: {
                    stroke: color,
                },
                text: {
                    fill: color,
                },
            },
            legend: {
                text: {
                    fill: color,
                },
            },
        },
    };
};

const createRatingDistribution = async (): Promise<{
    playerData: any[];
    cumulativeData: any[];
    effectiveMinRating: number;
    effectiveMaxRating: number;
} | null> => {
    try {
        const response = await fetch("/termination-api/rating-histogram", {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        });
        const data: RatingHistogramResponse = await response.json();

        if (data.status !== "success") {
            throw new Error("Failed to fetch rating histogram");
        }
        // Calculate effective min and max ratings
        const firstNonZeroIndex = data.freq.findIndex((f) => f > 0);
        const lastNonZeroIndex =
            data.freq.length - 1 - [...data.freq].reverse().findIndex((f) => f > 0);
        const effectiveMinRating =
            firstNonZeroIndex === -1 ? data.min_rating : data.ratings[firstNonZeroIndex];
        const effectiveMaxRating =
            firstNonZeroIndex === -1 ? data.max_rating : data.ratings[lastNonZeroIndex];

        // Prepare player distribution data
        const playerData = [
            {
                id: "Players",
                color: line2Color,
                data: data.ratings
                    .map((rating, i) => ({
                        x: rating,
                        y: data.freq[i],
                    }))
                    .slice(firstNonZeroIndex, lastNonZeroIndex + 1),
            },
        ];

        // Calculate cumulative distribution
        const total = data.freq.reduce((sum, val) => sum + val, 0);
        let cumSum = 0;
        const cumulativeData = [
            {
                id: "Cumulative",
                color: line2Color,
                data: data.ratings
                    .map((rating, i) => {
                        cumSum += data.freq[i];
                        return {
                            x: rating,
                            y: total > 0 ? cumSum / total : 0,
                        };
                    })
                    .slice(firstNonZeroIndex, lastNonZeroIndex + 1),
            },
        ];
        return {
            playerData,
            cumulativeData,
            effectiveMinRating,
            effectiveMaxRating,
        };
    } catch (error) {
        console.warn("Error fetching rating histogram:", error);
        // Generate zero-filled sample data
        const TotalBins = 31;
        const ratings = Array.from({ length: TotalBins }, (_, i) => 100 + i * 100);
        return {
            playerData: [
                {
                    id: "Players",
                    color: line2Color,
                    data: ratings.map((rating) => ({
                        x: rating,
                        y: 0,
                    })),
                },
            ],
            cumulativeData: [
                {
                    id: "Cumulative",
                    color: line2Color,
                    data: ratings.map((rating) => ({
                        x: rating,
                        y: 0,
                    })),
                },
            ],
            effectiveMinRating: 100,
            effectiveMaxRating: 3100,
        };
    }
};

const findRatingPercentile = (
    InputRating: number,
    cumulativeData: Array<{ x: number; y: number }>,
) => {
    if (!cumulativeData || cumulativeData.length === 0) {
        return null;
    }
    if (cumulativeData.length === 1) {
        return InputRating >= cumulativeData[0].x ? 100 : 0;
    }
    // Handle out of bounds cases
    if (InputRating <= cumulativeData[0].x) {
        return 0;
    }
    if (InputRating >= cumulativeData[cumulativeData.length - 1].x) {
        return 100;
    }
    // interpolation
    for (let i = 0; i < cumulativeData.length - 1; i++) {
        const curr = cumulativeData[i];
        const next = cumulativeData[i + 1];
        if (curr.x <= InputRating && next.x >= InputRating) {
            const interpolatedY =
                curr.y + ((InputRating - curr.x) * (next.y - curr.y)) / (next.x - curr.x);
            return (interpolatedY / cumulativeData[cumulativeData.length - 1].y) * 100;
        }
    }
    return null;
};

const RatingsChartDistribution: React.FC<RatingsChartDistributionProps> = ({
    myRating,
    otherRating,
    otherPlayerName,
    showRatings,
}) => {
    const [chartData, setChartData] = React.useState<{
        playerData: any[];
        cumulativeData: any[];
        effectiveMinRating: number;
        effectiveMaxRating: number;
    } | null>(null);

    const truncatedPlayerName =
        otherPlayerName && otherPlayerName.length > 20
            ? `${otherPlayerName.substring(0, 20)}...`
            : otherPlayerName;

    React.useEffect(() => {
        const fetchData = async () => {
            const data = await createRatingDistribution();
            setChartData(data);
        };
        void fetchData();
    }, []);

    if (!chartData) {
        return (
            <div className="RatingsChartDistribution">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    const FirstYAxisChart = () => (
        <ResponsiveLine
            // key={showRatings ? "ratings" : "ranks"}
            data={chartData.playerData}
            colors={[line1Color]}
            curve="basis"
            // curve="step"
            enableArea={true}
            areaOpacity={0.2}
            layers={[
                "axes",
                "areas",
                "lines",
                "markers",
                "legends",
                ({ xScale }: { xScale: (value: number) => number }) => {
                    if (myRating) {
                        return (
                            <circle
                                cx={xScale(
                                    Math.min(
                                        Math.max(myRating, chartData.effectiveMinRating),
                                        chartData.effectiveMaxRating,
                                    ),
                                )}
                                cy={0}
                                r={4}
                                fill={line3Color}
                            />
                        );
                    }
                    if (otherRating) {
                        return (
                            <circle
                                cx={xScale(
                                    Math.min(
                                        Math.max(otherRating, chartData.effectiveMinRating),
                                        chartData.effectiveMaxRating,
                                    ),
                                )}
                                cy={0}
                                r={4}
                                fill={line3Color}
                            />
                        );
                    }
                    return null;
                },
            ]}
            axisLeft={{
                legend: chartLabel.players,
                legendPosition: "middle",
                tickValues: 5,
                format: (value) => {
                    return value.toLocaleString();
                },
                // added extra margin for large tick values
                legendOffset: -30,
                tickSize: 0,
                tickPadding: -20,
            }}
            axisBottom={{
                tickValues: 8,
                format: (value) =>
                    showRatings ? value.toString() : boundedRankString(rating_to_rank(value), true),
            }}
            theme={getColoredAxis(line1Color)}
            xScale={{
                type: "linear",
                min: chartData.effectiveMinRating,
                max: chartData.effectiveMaxRating,
            }}
            yScale={{
                type: "linear",
                min: 0,
                max: Math.max(...chartData.playerData[0].data.map((d: { y: number }) => d.y)) * 1.0,
            }}
            margin={{ top: 50, right: 50, bottom: 50, left: 50 }}
            animate={true}
            motionConfig="slow"
            markers={[
                ...(myRating
                    ? [
                          {
                              axis: "x" as const,
                              value: Math.min(
                                  Math.max(myRating, chartData.effectiveMinRating),
                                  chartData.effectiveMaxRating,
                              ),
                              lineStyle: {
                                  stroke: line3Color,
                                  strokeWidth: 2,
                                  strokeDasharray: "10,0",
                              },
                              legend: chartLabel.yourRating,
                              legendPosition: "top" as const,
                              legendOrientation: "horizontal" as const,
                              textStyle: {
                                  fill: line3Color,
                                  fontSize: 12,
                              },
                          },
                      ]
                    : []),
                ...(otherRating
                    ? [
                          {
                              axis: "x" as const,
                              value: Math.min(
                                  Math.max(otherRating, chartData.effectiveMinRating),
                                  chartData.effectiveMaxRating,
                              ),
                              lineStyle: {
                                  stroke: line3Color,
                                  strokeWidth: 2,
                                  strokeDasharray: "10,0",
                              },
                              legend: truncatedPlayerName,
                              legendPosition: "top" as const,
                              legendOrientation: "horizontal" as const,
                              textStyle: {
                                  fill: line3Color,
                                  fontSize: 12,
                                  fontWeight: "bold",
                              },
                          },
                      ]
                    : []),
            ]}
        />
    );

    const SecondYAxisChart = () => (
        <ResponsiveLine
            // key={showRatings ? "ratings" : "ranks"}
            data={[...chartData.playerData, ...chartData.cumulativeData]}
            colors={["rgba(0, 0, 0, 0)", "#FFAE2C"]}
            curve="cardinal"
            margin={{ top: 50, right: 50, bottom: 50, left: 50 }}
            yScale={{
                type: "linear",
                min: 0,
                max: 1,
            }}
            xScale={{
                type: "linear",
                min: chartData.effectiveMinRating,
                max: chartData.effectiveMaxRating,
            }}
            axisRight={{
                legend: chartLabel.cumulative,
                legendPosition: "middle",
                legendOffset: 40,
                format: (value) => `${Math.round(value * 100)}%`,
                tickValues: [0, 0.2, 0.4, 0.6, 0.8, 1],
            }}
            axisLeft={null}
            axisTop={null}
            enableGridY={false}
            enableGridX={false}
            axisBottom={null}
            theme={{
                ...getColoredAxis(line2Color),
                crosshair: {
                    line: {
                        stroke: line1Color,
                        strokeWidth: 1,
                    },
                },
            }}
            useMesh={true}
            enableSlices="x"
            sliceTooltip={({ slice }) => {
                return (
                    <div
                        style={{
                            background: "rgba(0, 0, 0, 0.7)",
                            padding: "9px 12px",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "8px",
                            color: "white",
                        }}
                    >
                        <div>
                            {showRatings
                                ? `${chartLabel.rating}: ${slice.points[0].data.x}`
                                : `${chartLabel.rank}: ${boundedRankString(
                                      rating_to_rank(Number(slice.points[0].data.x)),
                                      true,
                                  )}`}
                        </div>
                        {slice.points.map((point) => (
                            <div
                                key={point.id}
                                style={{
                                    color:
                                        point.serieColor === "rgba(0, 0, 0, 0)"
                                            ? line1Color
                                            : point.serieColor,
                                    padding: "3px 0",
                                }}
                            >
                                <strong>{gettext(String(point.serieId))}:</strong>{" "}
                                {point.serieId === "Cumulative"
                                    ? `${(Number(point.data.y) * 100).toFixed(2)}%`
                                    : point.data.yFormatted}
                            </div>
                        ))}
                    </div>
                );
            }}
            animate={true}
            motionConfig="slow"
        />
    );

    let percentile: number | null = null;
    if (otherRating && chartData?.cumulativeData?.[0]?.data) {
        const calculatedPercentile = findRatingPercentile(
            otherRating,
            chartData.cumulativeData[0].data,
        );
        if (calculatedPercentile !== null) {
            percentile = calculatedPercentile;
        }
    } else if (myRating && chartData?.cumulativeData?.[0]?.data) {
        const calculatedPercentile = findRatingPercentile(
            myRating,
            chartData.cumulativeData[0].data,
        );
        if (calculatedPercentile !== null) {
            percentile = calculatedPercentile;
        }
    }

    return (
        <div className="RatingsChartDistribution">
            {percentile !== null && !isNaN(percentile) && (
                <h4>
                    {myRating
                        ? interpolate(
                              pgettext(
                                  "player performance rating distribution",
                                  "You have a higher rating than {{percentile}}% of players",
                              ),
                              {
                                  percentile: percentile.toFixed(2),
                              },
                          )
                        : interpolate(
                              pgettext(
                                  "player performance rating distribution",
                                  "{{name}} has a higher rating than {{percentile}}% of players",
                              ),
                              {
                                  name: truncatedPlayerName || _("User"),
                                  percentile: percentile.toFixed(2),
                              },
                          )}
                </h4>
            )}
            <div className="wrapper">
                <div className="graphContainer">
                    <FirstYAxisChart />
                </div>
                <div className="secondGraph">
                    <SecondYAxisChart />
                </div>
            </div>
        </div>
    );
};

export { RatingsChartDistribution };
