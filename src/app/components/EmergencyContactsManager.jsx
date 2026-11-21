import React from 'react';
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { UserPlus, Phone, Mail, Trash2, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "../utils/api";
function EmergencyContactsManager({ userId }) {
  const [contacts, setContacts] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("family");
  useEffect(() => {
    loadContacts();
  }, []);
  const loadContacts = async () => {
    try {
      const result = await api.getProfile();
      if (result.profile?.emergencyContacts) {
        setContacts(result.profile.emergencyContacts);
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error("Name and phone are required");
      return;
    }
    try {
      const newContact = {
        id: editingContact?.id || `contact_${Date.now()}`,
        name,
        phone,
        email,
        relationship
      };
      let updatedContacts;
      if (editingContact) {
        updatedContacts = contacts.map((c) => c.id === editingContact.id ? newContact : c);
        toast.success("Contact updated successfully");
      } else {
        updatedContacts = [...contacts, newContact];
        toast.success("Emergency contact added successfully");
      }
      await api.updateProfile({ emergencyContacts: updatedContacts });
      setContacts(updatedContacts);
      handleCloseDialog();
    } catch (error) {
      toast.error("Failed to save contact");
      console.error("Error saving contact:", error);
    }
  };
  const handleDelete = async (contactId) => {
    try {
      const updatedContacts = contacts.filter((c) => c.id !== contactId);
      await api.updateProfile({ emergencyContacts: updatedContacts });
      setContacts(updatedContacts);
      toast.success("Contact deleted successfully");
    } catch (error) {
      toast.error("Failed to delete contact");
      console.error("Error deleting contact:", error);
    }
  };
  const handleEdit = (contact) => {
    setEditingContact(contact);
    setName(contact.name);
    setPhone(contact.phone);
    setEmail(contact.email || "");
    setRelationship(contact.relationship);
    setIsDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingContact(null);
    setName("");
    setPhone("");
    setEmail("");
    setRelationship("family");
  };
  const getRelationshipColor = (relationship2) => {
    switch (relationship2) {
      case "family":
        return "bg-blue-500";
      case "friend":
        return "bg-green-500";
      case "colleague":
        return "bg-purple-500";
      case "doctor":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  return /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100 dark:bg-gray-900/90 dark:border-pink-900/40" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Users, { className: "w-5 h-5 text-pink-600 dark:text-pink-400" }), "Emergency Contacts"), /* @__PURE__ */ React.createElement(CardDescription, { className: "dark:text-gray-400" }, "SMS and email alerts are sent when provider credentials are configured; response team alerts appear in the app")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, contacts.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "text-center py-6" }, /* @__PURE__ */ React.createElement(AlertCircle, { className: "w-12 h-12 text-gray-400 mx-auto mb-2" }), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 dark:text-gray-400 mb-4" }, "No emergency contacts added yet"), /* @__PURE__ */ React.createElement(Dialog, { open: isDialogOpen, onOpenChange: setIsDialogOpen }, /* @__PURE__ */ React.createElement(DialogTrigger, { asChild: true }, /* @__PURE__ */ React.createElement(Button, { className: "bg-gradient-to-r from-pink-500 to-red-500" }, /* @__PURE__ */ React.createElement(UserPlus, { className: "w-4 h-4 mr-2" }), "Add First Contact")), /* @__PURE__ */ React.createElement(DialogContent, null, /* @__PURE__ */ React.createElement(DialogHeader, null, /* @__PURE__ */ React.createElement(DialogTitle, null, editingContact ? "Edit Contact" : "Add Emergency Contact"), /* @__PURE__ */ React.createElement(DialogDescription, null, "This person will be notified when you activate SOS")), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "name" }, "Name *"), /* @__PURE__ */ React.createElement(
    Input,
    {
      id: "name",
      value: name,
      onChange: (e) => setName(e.target.value),
      placeholder: "John Doe",
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "phone" }, "Phone Number *"), /* @__PURE__ */ React.createElement(
    Input,
    {
      id: "phone",
      type: "tel",
      value: phone,
      onChange: (e) => setPhone(e.target.value),
      placeholder: "+1 234 567 8900",
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "email" }, "Email (Optional)"), /* @__PURE__ */ React.createElement(
    Input,
    {
      id: "email",
      type: "email",
      value: email,
      onChange: (e) => setEmail(e.target.value),
      placeholder: "john@example.com"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "relationship" }, "Relationship"), /* @__PURE__ */ React.createElement(Select, { value: relationship, onValueChange: setRelationship }, /* @__PURE__ */ React.createElement(SelectTrigger, null, /* @__PURE__ */ React.createElement(SelectValue, null)), /* @__PURE__ */ React.createElement(SelectContent, null, /* @__PURE__ */ React.createElement(SelectItem, { value: "family" }, "Family"), /* @__PURE__ */ React.createElement(SelectItem, { value: "friend" }, "Friend"), /* @__PURE__ */ React.createElement(SelectItem, { value: "colleague" }, "Colleague"), /* @__PURE__ */ React.createElement(SelectItem, { value: "doctor" }, "Doctor"), /* @__PURE__ */ React.createElement(SelectItem, { value: "other" }, "Other")))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(Button, { type: "submit", className: "flex-1 bg-gradient-to-r from-pink-500 to-red-500" }, editingContact ? "Update" : "Add", " Contact"), /* @__PURE__ */ React.createElement(Button, { type: "button", variant: "outline", onClick: handleCloseDialog }, "Cancel")))))) : /* @__PURE__ */ React.createElement(React.Fragment, null, contacts.map((contact) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: contact.id,
      className: "flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center text-white font-semibold" }, contact.name.charAt(0).toUpperCase()), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("p", { className: "font-semibold" }, contact.name), /* @__PURE__ */ React.createElement(Badge, { className: getRelationshipColor(contact.relationship), variant: "secondary" }, contact.relationship)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 text-xs text-gray-600 mt-1" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Phone, { className: "w-3 h-3" }), contact.phone), contact.email && /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Mail, { className: "w-3 h-3" }), contact.email)))),
    /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
      Button,
      {
        size: "sm",
        variant: "outline",
        onClick: () => handleEdit(contact)
      },
      "Edit"
    ), /* @__PURE__ */ React.createElement(
      Button,
      {
        size: "sm",
        variant: "ghost",
        onClick: () => handleDelete(contact.id)
      },
      /* @__PURE__ */ React.createElement(Trash2, { className: "w-4 h-4 text-red-500" })
    ))
  )), /* @__PURE__ */ React.createElement(Dialog, { open: isDialogOpen, onOpenChange: setIsDialogOpen }, /* @__PURE__ */ React.createElement(DialogTrigger, { asChild: true }, /* @__PURE__ */ React.createElement(Button, { className: "w-full bg-gradient-to-r from-pink-500 to-red-500" }, /* @__PURE__ */ React.createElement(UserPlus, { className: "w-4 h-4 mr-2" }), "Add Another Contact")), /* @__PURE__ */ React.createElement(DialogContent, null, /* @__PURE__ */ React.createElement(DialogHeader, null, /* @__PURE__ */ React.createElement(DialogTitle, null, editingContact ? "Edit Contact" : "Add Emergency Contact"), /* @__PURE__ */ React.createElement(DialogDescription, null, "This person will be notified when you activate SOS")), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "name" }, "Name *"), /* @__PURE__ */ React.createElement(
    Input,
    {
      id: "name",
      value: name,
      onChange: (e) => setName(e.target.value),
      placeholder: "John Doe",
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "phone" }, "Phone Number *"), /* @__PURE__ */ React.createElement(
    Input,
    {
      id: "phone",
      type: "tel",
      value: phone,
      onChange: (e) => setPhone(e.target.value),
      placeholder: "+1 234 567 8900",
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "email" }, "Email (Optional)"), /* @__PURE__ */ React.createElement(
    Input,
    {
      id: "email",
      type: "email",
      value: email,
      onChange: (e) => setEmail(e.target.value),
      placeholder: "john@example.com"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "relationship" }, "Relationship"), /* @__PURE__ */ React.createElement(Select, { value: relationship, onValueChange: setRelationship }, /* @__PURE__ */ React.createElement(SelectTrigger, null, /* @__PURE__ */ React.createElement(SelectValue, null)), /* @__PURE__ */ React.createElement(SelectContent, null, /* @__PURE__ */ React.createElement(SelectItem, { value: "family" }, "Family"), /* @__PURE__ */ React.createElement(SelectItem, { value: "friend" }, "Friend"), /* @__PURE__ */ React.createElement(SelectItem, { value: "colleague" }, "Colleague"), /* @__PURE__ */ React.createElement(SelectItem, { value: "doctor" }, "Doctor"), /* @__PURE__ */ React.createElement(SelectItem, { value: "other" }, "Other")))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(Button, { type: "submit", className: "flex-1 bg-gradient-to-r from-pink-500 to-red-500" }, editingContact ? "Update" : "Add", " Contact"), /* @__PURE__ */ React.createElement(Button, { type: "button", variant: "outline", onClick: handleCloseDialog }, "Cancel")))))))));
}
export {
  EmergencyContactsManager
};
