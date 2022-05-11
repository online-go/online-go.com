/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import * as moment from "moment";
import * as data from "data";
import { post, put, del } from "requests";
import { deepCompare, errorAlerter } from "misc";
import { PaginatedTable } from "PaginatedTable";
import { Player } from "Player";
import swal from "sweetalert2";
/*
import { Card } from "material";
import { SearchInput } from "misc-ui";
import { Player } from "Player";
import * as moment from "moment";
import { chat_markup } from "Chat";
*/

type Operator = "EQUALS" | "GREATER_THAN" | "LESS_THAN" | "REGEX_MATCHES" | "OR" | "AND";
const OPERATORS: Array<Operator> = [
    "EQUALS",
    "GREATER_THAN",
    "LESS_THAN",
    "REGEX_MATCHES",
    "OR",
    "AND",
];

type FieldName =
    | "screen_width"
    | "screen_height"
    | "user_agent"
    | "timezone_offset"
    | "anonymous_ip"
    | "private_ip";

const FIELDS: { [name in FieldName]: string } = {
    screen_width: "number",
    screen_height: "number",
    user_agent: "text",
    timezone_offset: "number",
    anonymous_ip: "boolean",
    private_ip: "boolean",
};

interface Rule {
    operator: Operator;
    children?: Rule[];
    field?: FieldName;
    value?: string | number | boolean;
}

type Action = "ACCEPT" | "REJECT" | "COLLECT_VPN_INFORMATION";
const ACTIONS: Array<Action> = ["ACCEPT", "REJECT", "COLLECT_VPN_INFORMATION"];

interface MatchHistoryEntry {
    id: number;
    timestamp: string;
    asn: number;
    inet: string;
    action: string;
    ip_details: any;
    match_data: any;
    log_data: any;
}

interface Network {
    id: number;
    created: string;
    modified: string;
    asn: number | null;
    inet: string;
    notes: string;
}

interface FirewallRule {
    id: number;
    active: boolean;
    priority: number;
    rule: Rule;
    action: string;
    notes: string;

    num_matches: number;
    recent_matches: MatchHistoryEntry[];
    networks: Network[];
}

export function Firewall(): JSX.Element {
    const user = data.get("user");

    const table_ref = React.useRef(null);

    const new_rule_def: FirewallRule = {
        id: newid(),
        active: false,
        priority: 0,
        rule: {
            operator: "AND",
            children: [],
            field: "screen_width",
            value: 0,
        },
        action: "COLLECT_VPN_INFORMATION",
        notes: "New Rule",
        num_matches: 0,
        recent_matches: [],
        networks: [],
    };

    function refresh() {
        table_ref.current.refresh();
    }

    const new_rule = React.useRef(new_rule_def);

    if (!user.is_moderator) {
        return null;
    }

    return (
        <div className="Firewall">
            <div className="new-rule">
                <h4>Create new rule</h4>
                <FirewallRuleRow firewall_rule={new_rule.current} table_refresh={refresh} />
            </div>

            <h3>Rules</h3>
            <PaginatedTable
                className="firewall-rules"
                source={`/firewall/rules`}
                ref={table_ref}
                columns={[
                    {
                        header: "",
                        className: "rule",
                        render: (firewall_rule) => (
                            <FirewallRuleRow
                                firewall_rule={firewall_rule}
                                table_refresh={refresh}
                            />
                        ),
                    },
                ]}
            />
        </div>
    );
}

interface TestResult {
    player_id: number;
    last_ip: string;
    username: string;
    details: any;
    action: string;
}

function FirewallRuleRow({
    firewall_rule,
    table_refresh,
}: {
    firewall_rule: FirewallRule;
    table_refresh: () => void;
}): JSX.Element {
    const user = data.get("user");

    const [active, setActive] = React.useState(firewall_rule.active);
    const [action, setAction] = React.useState(firewall_rule.action);
    const [notes, setNotes] = React.useState(firewall_rule.notes);
    const [, _refresh] = React.useState({});
    const [testResults, setTestResults] = React.useState<TestResult[] | null>(null);
    const [numAnalyzed, setNumAnalyzed] = React.useState(0);
    const [message, setMessage] = React.useState(null as string | null);
    const [testing, setTesting] = React.useState(false);

    console.log(firewall_rule);

    function test() {
        if (testing) {
            return;
        }
        setTesting(true);
        console.log("test", firewall_rule);
        post("/firewall/test", firewall_rule)
            .then((res: { num_analyzed: number; matches: TestResult[] }) => {
                setTesting(false);
                console.log("test results", res);
                setMessage(null);
                setNumAnalyzed(res.num_analyzed);
                setTestResults(res.matches);
            })
            .catch((err: any) => {
                setTesting(false);
                console.error(err);
                setMessage("Error testing rule");
            });
    }

    function save() {
        put(`/firewall/rule/${firewall_rule.id}`, firewall_rule)
            .then(() => {
                table_refresh();
                swal("Saved")
                    .then(() => 0)
                    .catch(() => 0);
                setMessage(null);
            })
            .catch((err: any) => {
                console.error(err);
                setMessage("Error saving rule");
                table_refresh();
            });
    }

    function refresh() {
        _refresh({});
    }

    function del_row() {
        swal({
            text: "Are you sure you want to delete this row?",
            showCancelButton: true,
            confirmButtonText: "Yes",
            cancelButtonText: "Cancel",
        })
            .then(() => {
                del(`/firewall/rule/${firewall_rule.id}`)
                    .then(() => {
                        table_refresh();
                        swal("Deleted")
                            .then(() => 0)
                            .catch(() => 0);
                    })
                    .catch(errorAlerter);
            })
            .catch(() => 0);
    }

    return (
        <div className="FirewallRuleRow">
            <div className="header">
                <label>{firewall_rule.active ? "Active" : "Inactive"}</label>
                <input
                    type="checkbox"
                    checked={active}
                    onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                        firewall_rule.active = ev.target.checked;
                        setActive(ev.target.checked);
                    }}
                />

                <select
                    value={action}
                    onChange={(ev: React.ChangeEvent<HTMLSelectElement>) => {
                        firewall_rule.action = ev.target.value;
                        setAction(ev.target.value);
                    }}
                >
                    {ACTIONS.map((action) => (
                        <option key={action} value={action}>
                            {action}
                        </option>
                    ))}
                </select>

                <span className="priority">Priority: {firewall_rule.priority}</span>

                <input
                    className="notes"
                    placeholder="Notes"
                    value={notes}
                    onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                        firewall_rule.notes = ev.target.value;
                        setNotes(ev.target.value);
                    }}
                />
            </div>

            <div>
                <RuleEditor rule={firewall_rule.rule} parent={null} refresh={refresh} />
            </div>

            <div>
                <NetworkEditor firewall_rule={firewall_rule} refresh={refresh} />
            </div>

            <div>
                <RecentMatches firewall_rule={firewall_rule} />
            </div>

            <div className="buttons">
                {(firewall_rule.id > 0 || null) && (
                    <button
                        className="reject"
                        style={{ float: "left" }}
                        onClick={del_row}
                        disabled={!user.is_superuser}
                    >
                        Delete
                    </button>
                )}
                <button className="primary" onClick={test}>
                    Test
                </button>
                <button className="danger" onClick={save}>
                    {firewall_rule.id > 0 ? "Save" : "Create"}
                </button>
            </div>

            {(testing || null) && <h1>Running tests, this might take awhile</h1>}

            {testResults && (
                <>
                    <h3>
                        Test Results: {testResults.length} new users would have been blocked (Tested
                        against last {numAnalyzed} registrations)
                    </h3>
                    <div className="test-results">
                        {testResults.map((result, idx) => (
                            <TestResultRow key={idx} result={result} />
                        ))}
                    </div>
                </>
            )}
            {message}
        </div>
    );
}

function TestResultRow({ result }: { result: TestResult }): JSX.Element {
    return (
        <div className="TestResultRow">
            <span>{result.action || "<no action>"}</span>
            <Player user={result.player_id} />
            <span className="details" title={JSON.stringify(result.details, null, 2)}>
                details
            </span>
        </div>
    );
}

interface RuleEditorProps {
    rule: Rule;
    parent: Rule | null;
    refresh: () => void;
}

function RuleEditor({ rule, parent, refresh }: RuleEditorProps): JSX.Element {
    const [field, setField] = React.useState(rule.field);
    const [value, setValue]: [string | number | boolean, (tf: string | number | boolean) => void] =
        React.useState(rule.value as string | number | boolean);
    const [operator, setOperator] = React.useState(rule.operator);

    const use_children = operator === "AND" || operator === "OR";

    function del() {
        console.log("delete");
        parent.children = parent.children.filter((child) => !deepCompare(child, rule));
        refresh();
    }
    function add() {
        const new_rule = {
            operator: "AND" as Operator,
            children: [],
            field: "screen_width" as FieldName,
            value: "123",
        };
        rule.children.push(new_rule);
        refresh();
    }

    if (!rule) {
        return null;
    }

    return (
        <div className="RuleEditor">
            {parent && <i className="fa fa-trash" onClick={del} />}
            {(!use_children || null) && (
                <>
                    <select
                        className="field"
                        value={field}
                        onChange={(ev: React.ChangeEvent<HTMLSelectElement>) => {
                            rule.field = ev.target.value as FieldName;
                            setField(rule.field);
                        }}
                    >
                        {Object.keys(FIELDS).map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                </>
            )}

            <select
                className="operator"
                value={operator}
                onChange={(ev: React.ChangeEvent<HTMLSelectElement>) => {
                    rule.operator = ev.target.value as Operator;
                    setOperator(rule.operator);
                }}
            >
                {OPERATORS.map((op) => (
                    <option key={op} value={op}>
                        {op}
                    </option>
                ))}
            </select>

            {(use_children || null) && <button onClick={add}>Add</button>}

            {use_children ? (
                rule.children?.map((child) => (
                    <RuleEditor key={Math.random()} rule={child} parent={rule} refresh={refresh} />
                ))
            ) : (
                <>
                    {FIELDS[field] === "number" ? (
                        <input
                            type="number"
                            value={value as number}
                            onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                                rule.value = parseInt(ev.target.value);
                                setValue(rule.value);
                            }}
                        />
                    ) : FIELDS[field] === "text" ? (
                        <input
                            type="text"
                            value={value as string}
                            onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                                rule.value = ev.target.value;
                                setValue(rule.value);
                            }}
                        />
                    ) : FIELDS[field] === "boolean" ? (
                        <input
                            type="checkbox"
                            checked={value as boolean}
                            onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                                rule.value = ev.target.checked;
                                setValue(rule.value);
                            }}
                        />
                    ) : (
                        <div>Unknown field type</div>
                    )}
                </>
            )}
        </div>
    );
}

interface NetworkEditorProps {
    firewall_rule: FirewallRule;
    refresh: () => void;
}

function NetworkEditor({ firewall_rule, refresh }: NetworkEditorProps): JSX.Element {
    function add() {
        firewall_rule.networks.push({
            id: newid(),
            asn: null,
            inet: "10.0.0.0/32",
            created: "",
            modified: "",
            notes: "",
        });
        refresh();
    }

    return (
        <div className="NetworkEditor">
            <h3>
                Networks <button onClick={add}>Add</button>
            </h3>
            {firewall_rule.networks.map((network) => (
                <NetworkEditorRow
                    key={network.id}
                    network={network}
                    firewall_rule={firewall_rule}
                    refresh={refresh}
                />
            ))}
        </div>
    );
}

function NetworkEditorRow({
    network,
    firewall_rule,
    refresh,
}: {
    network: Network;
    firewall_rule: FirewallRule;
    refresh: () => void;
}): JSX.Element {
    const [asn, setAsn] = React.useState(network.asn);
    const [inet, setInet] = React.useState(network.inet);
    const [notes, setNotes] = React.useState(network.notes);

    function del() {
        firewall_rule.networks = firewall_rule.networks.filter((n) => n.id !== network.id);
        refresh();
    }

    return (
        <div className="NetworkEditorRow">
            {parent && <i className="fa fa-trash" onClick={del} />}

            <input
                placeholder="ASN"
                type="number"
                value={asn || ""}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                    network.asn = parseInt(ev.target.value) || null;
                    setAsn(network.asn || null);
                }}
            />

            <input
                placeholder="Network"
                type="string"
                value={inet}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                    network.inet = ev.target.value;
                    setInet(network.inet);
                }}
            />

            <input
                placeholder="Notes"
                type="string"
                value={notes}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                    network.notes = ev.target.value;
                    setNotes(network.notes);
                }}
            />
        </div>
    );
}

/*
interface MatchHistoryEntry {
    id: number;
    timestamp: string;
    asn: number;
    inet: string;
    action: string;
    ip_details: any;
    match_data: any;
    log_data: any;
}
*/

function RecentMatches({ firewall_rule }: { firewall_rule: FirewallRule }): JSX.Element {
    return (
        <>
            <h3>Matches: {firewall_rule.num_matches}</h3>
            <div className="RecentMatches">
                {firewall_rule.recent_matches.map((match: MatchHistoryEntry) => (
                    <div
                        key={match.id}
                        className="MatchRow"
                        title={JSON.stringify(
                            {
                                inet: match.ip_details,
                                match: match.match_data,
                                log: match.log_data,
                            },
                            null,
                            2,
                        )}
                    >
                        <span className="timestamp">{moment(match.timestamp).fromNow()}</span>
                        <span className="asn">{match.asn}</span>
                        <span className="inet">{match.inet}</span>
                        <span className="action">{match.action}</span>
                        <span className="username">
                            Attempted username: {match?.log_data?.username}
                        </span>
                    </div>
                ))}
            </div>
        </>
    );
}

let next_new_id = -1;
function newid(): number {
    return next_new_id--;
}
