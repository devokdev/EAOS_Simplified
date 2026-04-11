import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { Modal } from "../components/Modal";
import { useToast } from "../components/ToastProvider";
import { Button, EmptyState, Loader, Panel } from "../components/ui";

const EMPTY_PREVIEW = null;

export function ComposePage() {
  const [searchParams] = useSearchParams();
  const { pushToast } = useToast();
  const [datasets, setDatasets] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(searchParams.get("dataset") || "");
  const [recipientMode, setRecipientMode] = useState("all");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("");
  const [customTemplateHtml, setCustomTemplateHtml] = useState("");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [improveContent, setImproveContent] = useState(false);
  const [improvementNotes, setImprovementNotes] = useState("");
  const [preview, setPreview] = useState(EMPTY_PREVIEW);
  const [reviewSubject, setReviewSubject] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [batchSize, setBatchSize] = useState(20);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [datasetList, templateList] = await Promise.all([
          api("/api/datasets/"),
          api("/api/templates/"),
        ]);
        setDatasets(datasetList);
        setTemplates(templateList);
        const initialDataset = searchParams.get("dataset") || datasetList[0]?.id || "";
        setSelectedDatasetId(initialDataset);
      } catch (error) {
        pushToast(error.message, "error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadContacts() {
      if (!selectedDatasetId) {
        setContacts([]);
        setSelectedRecipients([]);
        return;
      }
      try {
        const rows = await api(`/api/datasets/${selectedDatasetId}/contacts`);
        setContacts(rows);
        setSelectedRecipients([]);
        setPreview(EMPTY_PREVIEW);
      } catch (error) {
        pushToast(error.message, "error");
      }
    }
    loadContacts();
  }, [selectedDatasetId]);

  useEffect(() => {
    setPreview(EMPTY_PREVIEW);
  }, [subject, body, improveContent, improvementNotes, selectedTemplateKey, customTemplateHtml, recipientMode, search]);

  const selectedDataset = datasets.find((dataset) => dataset.id === selectedDatasetId);
  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return contacts;
    }
    return contacts.filter((contact) => {
      return (
        (contact.name || "").toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query)
      );
    });
  }, [contacts, search]);

  const recipientIds = recipientMode === "selected" ? selectedRecipients : [];
  const selectedCount = recipientMode === "selected" ? selectedRecipients.length : contacts.length;
  const templateLabel = selectedTemplateKey
    ? templates.find((item) => item.key === selectedTemplateKey)?.name || "Selected template"
    : customTemplateHtml
      ? "Custom HTML template"
      : "No template";
  const allVisibleSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((contact) => selectedRecipients.includes(contact.id));

  function toggleRecipient(contactId) {
    setSelectedRecipients((current) =>
      current.includes(contactId)
        ? current.filter((id) => id !== contactId)
        : [...current, contactId],
    );
    setPreview(EMPTY_PREVIEW);
  }

  function selectAllVisible() {
    setSelectedRecipients((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !filteredContacts.some((contact) => contact.id === id));
      }
      return Array.from(new Set([...current, ...filteredContacts.map((contact) => contact.id)]));
    });
    setRecipientMode("selected");
    setPreview(EMPTY_PREVIEW);
  }

  function clearTemplate() {
    setSelectedTemplateKey("");
    setCustomTemplateHtml("");
    setTemplateModalOpen(false);
    setPreview(EMPTY_PREVIEW);
  }

  function applyTemplate(templateKey) {
    setSelectedTemplateKey(templateKey);
    setCustomTemplateHtml("");
    setTemplateModalOpen(false);
    setPreview(EMPTY_PREVIEW);
  }

  function onUploadTemplate(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedTemplateKey("");
      setCustomTemplateHtml(String(reader.result || ""));
      setTemplateModalOpen(false);
      setPreview(EMPTY_PREVIEW);
      pushToast("Custom HTML template loaded", "success");
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  async function generatePreview() {
    if (!selectedDatasetId) {
      pushToast("Choose a dataset first", "error");
      return;
    }
    if (!body.trim()) {
      pushToast("Add an email body first", "error");
      return;
    }
    if (recipientMode === "selected" && !selectedRecipients.length) {
      pushToast("Select at least one recipient", "error");
      return;
    }
    setPreviewing(true);
    try {
      const data = await api("/api/automation/preview", {
        method: "POST",
        body: JSON.stringify({
          dataset_id: selectedDatasetId,
          template_key: selectedTemplateKey,
          custom_template_html: customTemplateHtml,
          subject,
          body,
          recipient_ids: recipientIds,
          improve_content: improveContent,
          improvement_notes: improvementNotes,
        }),
      });
      setPreview(data);
      setReviewSubject(data.subject || subject);
      setReviewBody(data.body || body);
      pushToast("Preview ready. Review and edit before sending.", "success");
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setPreviewing(false);
    }
  }

  async function sendBulk() {
    if (!preview) {
      pushToast("Use preview first, then review the final email", "error");
      return;
    }
    setSending(true);
    try {
      const result = await api("/api/automation/send", {
        method: "POST",
        body: JSON.stringify({
          dataset_id: selectedDatasetId,
          template_key: selectedTemplateKey,
          custom_template_html: customTemplateHtml,
          subject: reviewSubject,
          body: reviewBody,
          recipient_ids: recipientIds,
          batch_size: Number(batchSize) || 20,
          improve_content: false,
          improvement_notes: "",
        }),
      });
      pushToast(`Sent ${result.sent} emails`, "success");
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <Loader label="Loading composer" />;
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Bulk email composer</p>
          <h1>Write your email, optionally improve it, optionally apply an HTML template, then preview and edit before sending.</h1>
          <p className="hero-description">
            Use placeholders like {"{name}"} and {"{email}"} in the subject or body. Without a template, the email is sent as plain text only.
          </p>
        </div>
        <div className="hero-actions">
          <Button icon="eye" onClick={generatePreview}>{previewing ? "Preparing..." : "Preview"}</Button>
          <Button icon="send" onClick={sendBulk} variant="secondary">
            {sending ? "Sending..." : "Send after review"}
          </Button>
        </div>
      </section>

      <section className="compose-layout-wide">
        <Panel title="Recipients" subtitle={selectedDataset ? selectedDataset.name : "Choose a dataset"}>
          <div className="form-stack">
            <label className="field">
              <span>Dataset</span>
              <select className="input" value={selectedDatasetId} onChange={(event) => setSelectedDatasetId(event.target.value)}>
                <option value="">Select dataset</option>
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.contact_count})
                  </option>
                ))}
              </select>
            </label>

            <div className="recipient-toggle">
              <button type="button" className={`chip ${recipientMode === "all" ? "chip-active" : ""}`} onClick={() => setRecipientMode("all")}>
                Send to all
              </button>
              <button type="button" className={`chip ${recipientMode === "selected" ? "chip-active" : ""}`} onClick={() => setRecipientMode("selected")}>
                Choose specific people
              </button>
            </div>

            {recipientMode === "selected" ? (
              <>
              <div className="panel-toolbar">
                <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recipients" />
                <Button icon="check" variant="secondary" onClick={selectAllVisible}>
                  {allVisibleSelected ? "Deselect visible" : "Select visible"}
                </Button>
              </div>
                <div className="recipient-list">
                  {filteredContacts.map((contact) => (
                    <label className="recipient-row" key={contact.id}>
                      <input type="checkbox" checked={selectedRecipients.includes(contact.id)} onChange={() => toggleRecipient(contact.id)} />
                      <div>
                        <strong>{contact.name || contact.email}</strong>
                        <small>{contact.email}</small>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <div className="info-note">{contacts.length} recipients will be included.</div>
            )}
          </div>
        </Panel>

        <Panel title="Write email" subtitle={`${selectedCount} recipient${selectedCount === 1 ? "" : "s"} selected`}>
          <div className="form-stack">
            <div className="template-header">
              <div>
                <strong>HTML template</strong>
                <p className="muted">Optional. Templates only change the design, not the message type.</p>
              </div>
              <div className="template-actions-inline">
                <span className="info-note">{templateLabel}</span>
                <Button icon="eye" variant="secondary" onClick={() => setTemplateModalOpen(true)}>Choose template</Button>
              </div>
            </div>

            <label className="field">
              <span>Subject (optional)</span>
              <input className="input" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Use placeholders like {name}" />
            </label>

            <label className="field">
              <span>Email body</span>
              <textarea
                className="textarea textarea-tall"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={"Write your message here. You can use placeholders like {name} and {email}."}
              />
              <small className="helper-text">Placeholders: {"{name}"}, {"{email}"}. These are replaced per recipient.</small>
            </label>

            <label className="checkbox-row">
              <input type="checkbox" checked={improveContent} onChange={(event) => setImproveContent(event.target.checked)} />
              <span>Use AI to refine or write the full email before preview</span>
            </label>

            {improveContent ? (
              <label className="field">
                <span>AI instructions</span>
                <input
                  className="input"
                  value={improvementNotes}
                  onChange={(event) => setImprovementNotes(event.target.value)}
                  placeholder="Example: make it shorter, more persuasive, and founder-friendly"
                />
              </label>
            ) : null}

            <label className="field">
              <span>Batch size</span>
              <input className="input" type="number" min="1" max="100" value={batchSize} onChange={(event) => setBatchSize(event.target.value)} />
            </label>
          </div>
        </Panel>

        <Panel title="Review before send" subtitle="Preview, then edit the final version">
          {preview ? (
            <div className="preview-stack">
              <div className="preview-meta">
                <span>Preview recipient</span>
                <strong>{preview.preview_contact.name || preview.preview_contact.email}</strong>
                <small>{preview.preview_contact.email}</small>
              </div>
              <label className="field">
                <span>Final subject</span>
                <input className="input" value={reviewSubject} onChange={(event) => setReviewSubject(event.target.value)} />
              </label>
              <label className="field">
                <span>Final body</span>
                <textarea className="textarea textarea-medium" value={reviewBody} onChange={(event) => setReviewBody(event.target.value)} />
              </label>
              <div className="preview-meta">
                <span>Rendered preview</span>
                <small>{preview.contact_count} recipients in this send</small>
              </div>
              {(selectedTemplateKey || customTemplateHtml) ? (
                <div className="html-preview" dangerouslySetInnerHTML={{ __html: preview.rendered_html }} />
              ) : (
                <div className="plain-preview">{reviewBody || "No body"}</div>
              )}
            </div>
          ) : (
            <EmptyState
              icon="eye"
              title="No preview yet"
              description="Preview is required before sending so you can review and edit the final email."
            />
          )}
        </Panel>
      </section>

      <Modal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        title="Choose HTML template"
        description="Templates only control the visual design. You can also upload your own HTML."
        size="large"
        className="template-picker-modal"
      >
        <div className="template-picker-layout">
          <div className="template-picker-summary">
            <div className="template-picker-summary-copy">
              <strong>{templates.length} templates available</strong>
              <small>
                {selectedTemplateKey
                  ? `Selected: ${templates.find((template) => template.key === selectedTemplateKey)?.name || "Custom"}`
                  : customTemplateHtml
                    ? "Selected: Custom HTML template"
                    : "No template selected"}
              </small>
            </div>
            <span className="topbar-chip">Centered Preview Grid</span>
          </div>

          <div className="template-picker-scroll">
            <div className="template-gallery template-gallery-modal">
              {templates.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  className={`template-card ${selectedTemplateKey === template.key ? "template-card-active" : ""}`}
                  onClick={() => applyTemplate(template.key)}
                >
                  <strong>{template.name}</strong>
                  <span>{template.description}</span>
                  <div
                    className="template-preview-box"
                    dangerouslySetInnerHTML={{ __html: template.body.replace("{content}", "<p style='margin:0'>Preview content</p>") }}
                  />
                </button>
              ))}
            </div>

            <label className="field template-upload-field">
              <span>Upload custom HTML template</span>
              <input className="input" type="file" accept=".html,.htm,.txt" onChange={onUploadTemplate} />
              <small className="helper-text">Your custom template should include {"{content}"} where the message body should appear.</small>
            </label>
          </div>

          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={clearTemplate}>No template</Button>
            <Button type="button" variant="secondary" onClick={() => setTemplateModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
