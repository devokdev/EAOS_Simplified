import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { Modal } from "../components/Modal";
import { useToast } from "../components/ToastProvider";
import { Button, EmptyState, Loader, Panel } from "../components/ui";

const EMPTY_CONTACT = { name: "", email: "" };

export function ContactsPage() {
  const { pushToast } = useToast();
  const fileInputRef = useRef(null);
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [datasetModalOpen, setDatasetModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [datasetName, setDatasetName] = useState("");
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT);

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId),
    [datasets, selectedDatasetId],
  );

  async function loadDatasets() {
    const datasetList = await api("/api/datasets/");
    setDatasets(datasetList);
    setSelectedDatasetId((current) => {
      if (current && datasetList.some((item) => item.id === current)) {
        return current;
      }
      return datasetList[0]?.id || "";
    });
    return datasetList;
  }

  async function loadContacts(datasetId) {
    if (!datasetId) {
      setContacts([]);
      return;
    }
    const rows = await api(`/api/datasets/${datasetId}/contacts`);
    setContacts(rows);
  }

  async function bootstrap() {
    try {
      const datasetList = await loadDatasets();
      await loadContacts(datasetList[0]?.id || "");
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    if (selectedDatasetId) {
      loadContacts(selectedDatasetId).catch((error) => pushToast(error.message, "error"));
    } else {
      setContacts([]);
    }
  }, [selectedDatasetId]);

  async function createDataset(event) {
    event.preventDefault();
    try {
      await api("/api/datasets/", {
        method: "POST",
        body: JSON.stringify({ name: datasetName.trim() }),
      });
      pushToast("Dataset created", "success");
      setDatasetName("");
      setDatasetModalOpen(false);
      await loadDatasets();
    } catch (error) {
      pushToast(error.message, "error");
    }
  }

  async function uploadCsv(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(`/api/datasets/upload?name=${encodeURIComponent(datasetName.trim() || file.name)}`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "CSV upload failed");
      }
      pushToast(`Imported ${data.imported} contacts`, "success");
      await loadDatasets();
      setSelectedDatasetId(data.dataset.id);
      await loadContacts(data.dataset.id);
      setDatasetName("");
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      event.target.value = "";
    }
  }

  async function saveContact(event) {
    event.preventDefault();
    try {
      if (editingContact) {
        await api(`/api/datasets/contacts/${editingContact.id}`, {
          method: "PUT",
          body: JSON.stringify(contactForm),
        });
        pushToast("Contact updated", "success");
      } else {
        await api(`/api/datasets/${selectedDatasetId}/contacts`, {
          method: "POST",
          body: JSON.stringify(contactForm),
        });
        pushToast("Contact added", "success");
      }
      setContactModalOpen(false);
      setEditingContact(null);
      setContactForm(EMPTY_CONTACT);
      await loadDatasets();
      await loadContacts(selectedDatasetId);
    } catch (error) {
      pushToast(error.message, "error");
    }
  }

  async function deleteContact(contact) {
    if (!window.confirm(`Delete ${contact.email} from this dataset?`)) {
      return;
    }
    try {
      await api(`/api/datasets/contacts/${contact.id}`, { method: "DELETE" });
      pushToast("Contact deleted", "success");
      await loadDatasets();
      await loadContacts(selectedDatasetId);
    } catch (error) {
      pushToast(error.message, "error");
    }
  }

  async function deleteDataset() {
    if (!selectedDataset) {
      return;
    }
    if (!window.confirm(`Delete the dataset "${selectedDataset.name}" and all of its contacts and email history?`)) {
      return;
    }
    try {
      await api(`/api/datasets/${selectedDataset.id}`, { method: "DELETE" });
      pushToast("Dataset deleted", "success");
      const remaining = await loadDatasets();
      await loadContacts(remaining[0]?.id || "");
    } catch (error) {
      pushToast(error.message, "error");
    }
  }

  if (loading) {
    return <Loader label="Loading datasets" />;
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Dataset management</p>
          <h1>Save reusable contact datasets and manage every contact manually.</h1>
          <p className="hero-description">
            Upload CSV files, pick any saved dataset with one click, and keep contact CRUD in a straightforward table.
          </p>
        </div>
        <div className="hero-actions">
          <Button icon="plus" onClick={() => setDatasetModalOpen(true)}>New dataset</Button>
          <Button icon="upload" onClick={() => fileInputRef.current?.click()} variant="secondary">Upload CSV</Button>
          <Button href={selectedDataset ? `/templates?dataset=${selectedDataset.id}` : "/templates"} icon="compose" variant="secondary">
            Use selected dataset
          </Button>
        </div>
      </section>

      <input ref={fileInputRef} type="file" accept=".csv" hidden onChange={uploadCsv} />

      <section className="three-panel-grid">
        <Panel title="Datasets" subtitle={`${datasets.length} saved`}>
          {datasets.length ? (
            <div className="dataset-list">
              {datasets.map((dataset) => (
                <button
                  key={dataset.id}
                  type="button"
                  className={`dataset-card ${selectedDatasetId === dataset.id ? "dataset-card-active" : ""}`}
                  onClick={() => setSelectedDatasetId(dataset.id)}
                >
                  <strong>{dataset.name}</strong>
                  <span>{dataset.contact_count} contacts</span>
                  <small>{dataset.source_filename || "Manual dataset"}</small>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="contacts"
              title="No datasets yet"
              description="Create a dataset or upload a CSV to get started."
            />
          )}
        </Panel>

        <Panel className="span-2" title={selectedDataset ? selectedDataset.name : "Contacts"} subtitle={selectedDataset ? `${contacts.length} contacts` : "Select a dataset"}>
          {selectedDataset ? (
            <>
              <div className="panel-toolbar">
                <Button
                  icon="plus"
                  onClick={() => {
                    setEditingContact(null);
                    setContactForm(EMPTY_CONTACT);
                    setContactModalOpen(true);
                  }}
                >
                  Add contact
                </Button>
                <Button href={`/templates?dataset=${selectedDataset.id}`} icon="send" variant="secondary">
                  Compose email
                </Button>
                <Button icon="trash" variant="ghost" onClick={deleteDataset}>
                  Delete dataset
                </Button>
              </div>
              {contacts.length ? (
                <div className="simple-table">
                  <div className="table-row table-head">
                    <span>Name</span>
                    <span>Email</span>
                    <span>Created</span>
                    <span>Actions</span>
                  </div>
                  {contacts.map((contact) => (
                    <div className="table-row" key={contact.id}>
                      <span>{contact.name || "-"}</span>
                      <span>{contact.email}</span>
                      <span>{new Date(contact.created_at).toLocaleDateString()}</span>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            setEditingContact(contact);
                            setContactForm({ name: contact.name || "", email: contact.email || "" });
                            setContactModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button type="button" className="text-button danger" onClick={() => deleteContact(contact)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="mail"
                  title="No contacts in this dataset"
                  description="Add contacts manually or upload a CSV for this dataset."
                />
              )}
            </>
          ) : (
            <EmptyState
              icon="contacts"
              title="Pick a dataset"
              description="Your selected dataset will show its contact table here."
            />
          )}
        </Panel>
      </section>

      <Modal
        open={datasetModalOpen}
        onClose={() => setDatasetModalOpen(false)}
        title="Create dataset"
        description="Use this for a reusable contact list. You can upload CSV right after."
      >
        <form className="form-stack" onSubmit={createDataset}>
          <label className="field">
            <span>Dataset name</span>
            <input className="input" value={datasetName} onChange={(event) => setDatasetName(event.target.value)} placeholder="March prospects" required />
          </label>
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setDatasetModalOpen(false)}>Cancel</Button>
            <Button type="submit" icon="plus">Create</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={contactModalOpen}
        onClose={() => {
          setContactModalOpen(false);
          setEditingContact(null);
          setContactForm(EMPTY_CONTACT);
        }}
        title={editingContact ? "Edit contact" : "Add contact"}
        description="Name is optional. Email is required."
      >
        <form className="form-stack" onSubmit={saveContact}>
          <label className="field">
            <span>Name</span>
            <input
              className="input"
              value={contactForm.name}
              onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Jane Doe"
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              className="input"
              type="email"
              required
              value={contactForm.email}
              onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="jane@example.com"
            />
          </label>
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setContactModalOpen(false)}>Cancel</Button>
            <Button type="submit" icon="check">{editingContact ? "Save" : "Add"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
