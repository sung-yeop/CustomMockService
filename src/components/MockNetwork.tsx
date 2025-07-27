import React, { useState, useEffect } from "react";
import "../styles/MockNetwork.css";
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

  const getStatusClass = (status: number) => {
    if (status >= 200 && status < 300) return "success";
    if (status >= 300 && status < 400) return "redirect";
    return "error";
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
    <div className={`mock-network-panel ${isCollapsed ? "collapsed" : ""}`}>
      <div className="mock-network-header" onClick={handleToggle}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className="mock-network-title">Mock Network</span>
          {history.length > 0 && (
            <span className="mock-network-badge">{history.length}</span>
          )}
        </div>
        <div
          className="mock-network-controls"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="mock-network-btn clear" onClick={handleClear}>
            Clear
          </button>
          <button className="mock-network-btn toggle">
            {isCollapsed ? "▲" : "▼"}
          </button>
        </div>
      </div>

      <div className="mock-network-content">
        {history.length === 0 ? (
          <div className="mock-network-empty">No mock requests yet</div>
        ) : (
          <ul className="mock-request-list">
            {history.map((request) => (
              <li key={request.id}>
                <div
                  className={`mock-request-item ${
                    selectedRequest?.id === request.id ? "selected" : ""
                  }`}
                  onClick={() => handleRequestClick(request)}
                >
                  <div className="mock-request-header">
                    <span className={`mock-request-method ${request.method}`}>
                      {request.method}
                    </span>
                    <span
                      className={`mock-request-status ${getStatusClass(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                    <span className="mock-request-url">{request.url}</span>
                    <span className="mock-request-time">
                      {formatTime(request.timestamp)}
                    </span>
                  </div>
                  <div className="mock-request-meta">
                    <span className="mock-request-duration">
                      {request.duration}ms
                    </span>
                    <span>{request.statusText}</span>
                  </div>
                </div>

                {selectedRequest?.id === request.id && (
                  <div className="mock-request-details">
                    <div className="mock-detail-tabs">
                      <button
                        className={`mock-detail-tab ${
                          activeTab === "response" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("response")}
                      >
                        Response
                      </button>
                      <button
                        className={`mock-detail-tab ${
                          activeTab === "request" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("request")}
                      >
                        Request
                      </button>
                      <button
                        className={`mock-detail-tab ${
                          activeTab === "headers" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("headers")}
                      >
                        Headers
                      </button>
                    </div>

                    <div className="mock-detail-content">
                      {activeTab === "response" && (
                        <div className="mock-json">
                          {formatJson(request.responseBody)}
                        </div>
                      )}
                      {activeTab === "request" && (
                        <div className="mock-json">
                          {request.requestBody
                            ? formatJson(request.requestBody)
                            : "No request body"}
                        </div>
                      )}
                      {activeTab === "headers" && (
                        <div className="mock-json">
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
