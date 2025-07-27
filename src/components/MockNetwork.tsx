import React, { useState, useEffect } from "react";
import { CustomMockService } from "../util/CustomMockService";

interface MockHistoryEntry {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  requestBody?: any;
  requestHeaders?: Record<string, string>;
  status: number;
  statusText: string;
  responseBody: any;
  responseHeaders?: Record<string, string>;
  duration: number;
}

type TabType = "request" | "response" | "headers";

const styles = {
  panel: {
    position: "fixed" as const,
    bottom: 0,
    right: 0,
    width: "100%",
    maxWidth: "500px",
    height: "400px",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "8px 8px 0 0",
    boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.3)",
    fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
    fontSize: "12px",
    zIndex: 999999,
    transition: "transform 0.3s ease",
    boxSizing: "border-box" as const,
  },
  panelCollapsed: {
    transform: "translateY(calc(100% - 40px))",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    background: "#2d2d2d",
    borderBottom: "1px solid #444",
    borderRadius: "8px 8px 0 0",
    cursor: "pointer",
    userSelect: "none" as const,
  },
  titleContainer: {
    display: "flex",
    alignItems: "center",
  },
  title: {
    color: "#00d4aa",
    fontWeight: "bold",
    fontSize: "13px",
  },
  badge: {
    background: "#ff6b6b",
    color: "white",
    padding: "2px 6px",
    borderRadius: "10px",
    fontSize: "10px",
    marginLeft: "8px",
  },
  controls: {
    display: "flex",
    gap: "8px",
  },
  btn: {
    background: "#444",
    border: "none",
    color: "#ccc",
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "11px",
    transition: "background 0.2s",
  },
  btnClear: {
    background: "#ff6b6b",
    color: "white",
  },
  btnToggle: {
    background: "#00d4aa",
    color: "white",
  },
  content: {
    height: "calc(100% - 40px)",
    overflowY: "auto" as const,
    background: "#1a1a1a",
  },
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#666",
    fontStyle: "italic",
  },
  requestList: {
    padding: 0,
    margin: 0,
    listStyle: "none",
  },
  requestItem: {
    borderBottom: "1px solid #333",
    padding: "8px 12px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  requestItemSelected: {
    background: "#2a3f5f",
  },
  requestHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  },
  method: {
    padding: "2px 6px",
    borderRadius: "3px",
    fontWeight: "bold",
    fontSize: "10px",
    textTransform: "uppercase" as const,
    color: "white",
  },
  methodGET: { background: "#61affe" },
  methodPOST: { background: "#49cc90" },
  methodPUT: { background: "#fca130" },
  methodDELETE: { background: "#f93e3e" },
  methodPATCH: { background: "#50e3c2" },
  status: {
    padding: "2px 6px",
    borderRadius: "3px",
    fontWeight: "bold",
    fontSize: "10px",
  },
  statusSuccess: { background: "#28a745", color: "white" },
  statusError: { background: "#dc3545", color: "white" },
  statusRedirect: { background: "#ffc107", color: "black" },
  url: {
    color: "#ccc",
    fontSize: "11px",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  time: {
    color: "#888",
    fontSize: "10px",
  },
  meta: {
    display: "flex",
    gap: "12px",
    color: "#888",
    fontSize: "10px",
  },
  duration: {
    color: "#00d4aa",
  },
  details: {
    padding: "12px",
    background: "#222",
    borderTop: "1px solid #444",
    maxHeight: "200px",
    overflowY: "auto" as const,
  },
  tabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
    borderBottom: "1px solid #444",
  },
  tab: {
    background: "none",
    border: "none",
    color: "#888",
    padding: "6px 12px",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    fontSize: "11px",
    transition: "all 0.2s",
  },
  tabActive: {
    color: "#00d4aa",
    borderBottomColor: "#00d4aa",
  },
  detailContent: {
    color: "#ccc",
  },
  json: {
    background: "#1a1a1a",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #333",
    fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
    fontSize: "11px",
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-all" as const,
    maxHeight: "150px",
    overflowY: "auto" as const,
  },
};

const MockNetwork: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [history, setHistory] = useState<MockHistoryEntry[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<MockHistoryEntry | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("response");

  useEffect(() => {
    const interval = setInterval(() => {
      const currentHistory = CustomMockService.getHistory();
      setHistory(currentHistory);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleClear = () => {
    CustomMockService.clearHistory();
    setHistory([]);
    setSelectedRequest(null);
  };

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleRequestClick = (request: MockHistoryEntry) => {
    setSelectedRequest(selectedRequest?.id === request.id ? null : request);
  };

  const getStatusStyle = (status: number) => {
    if (status >= 200 && status < 300)
      return { ...styles.status, ...styles.statusSuccess };
    if (status >= 300 && status < 400)
      return { ...styles.status, ...styles.statusRedirect };
    return { ...styles.status, ...styles.statusError };
  };

  const getMethodStyle = (method: string) => {
    const methodKey = `method${method}` as keyof typeof styles;
    return { ...styles.method, ...(styles[methodKey] || {}) };
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <div
      style={{
        ...styles.panel,
        ...(isCollapsed ? styles.panelCollapsed : {}),
      }}
    >
      <div style={styles.header} onClick={handleToggle}>
        <div style={styles.titleContainer}>
          <span style={styles.title}>Mock Network</span>
          {history.length > 0 && (
            <span style={styles.badge}>{history.length}</span>
          )}
        </div>
        <div style={styles.controls} onClick={(e) => e.stopPropagation()}>
          <button
            style={{ ...styles.btn, ...styles.btnClear }}
            onClick={handleClear}
          >
            Clear
          </button>
          <button style={{ ...styles.btn, ...styles.btnToggle }}>
            {isCollapsed ? "▲" : "▼"}
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {history.length === 0 ? (
          <div style={styles.empty}>No mock requests yet</div>
        ) : (
          <ul style={styles.requestList}>
            {history.map((request) => (
              <li key={request.id}>
                <div
                  style={{
                    ...styles.requestItem,
                    ...(selectedRequest?.id === request.id
                      ? styles.requestItemSelected
                      : {}),
                    ...(selectedRequest?.id !== request.id
                      ? { ":hover": { background: "#252525" } }
                      : {}),
                  }}
                  onClick={() => handleRequestClick(request)}
                  onMouseEnter={(e) => {
                    if (selectedRequest?.id !== request.id) {
                      e.currentTarget.style.background = "#252525";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRequest?.id !== request.id) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div style={styles.requestHeader}>
                    <span style={getMethodStyle(request.method)}>
                      {request.method}
                    </span>
                    <span style={getStatusStyle(request.status)}>
                      {request.status}
                    </span>
                    <span style={styles.url}>{request.url}</span>
                    <span style={styles.time}>
                      {formatTime(request.timestamp)}
                    </span>
                  </div>
                  <div style={styles.meta}>
                    <span style={styles.duration}>{request.duration}ms</span>
                    <span>{request.statusText}</span>
                  </div>
                </div>

                {selectedRequest?.id === request.id && (
                  <div style={styles.details}>
                    <div style={styles.tabs}>
                      <button
                        style={{
                          ...styles.tab,
                          ...(activeTab === "response" ? styles.tabActive : {}),
                        }}
                        onClick={() => setActiveTab("response")}
                      >
                        Response
                      </button>
                      <button
                        style={{
                          ...styles.tab,
                          ...(activeTab === "request" ? styles.tabActive : {}),
                        }}
                        onClick={() => setActiveTab("request")}
                      >
                        Request
                      </button>
                      <button
                        style={{
                          ...styles.tab,
                          ...(activeTab === "headers" ? styles.tabActive : {}),
                        }}
                        onClick={() => setActiveTab("headers")}
                      >
                        Headers
                      </button>
                    </div>

                    <div style={styles.detailContent}>
                      {activeTab === "response" && (
                        <div style={styles.json}>
                          {formatJson(request.responseBody)}
                        </div>
                      )}
                      {activeTab === "request" && (
                        <div style={styles.json}>
                          {request.requestBody
                            ? formatJson(request.requestBody)
                            : "No request body"}
                        </div>
                      )}
                      {activeTab === "headers" && (
                        <div style={styles.json}>
                          {formatJson({
                            request: request.requestHeaders || {},
                            response: request.responseHeaders || {},
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MockNetwork;
