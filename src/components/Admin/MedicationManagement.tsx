import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  DollarSign,
  AlertCircle,
  Loader2,
  Save,
  X,
  TrendingUp,
} from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  description: string;
  category: string;
  manufacturer: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  dosage_form: string;
  strength: string;
  prescription_required: boolean;
  active_ingredients?: string;
  side_effects?: string;
  warnings?: string;
  is_available: boolean;
  created_at: string;
}

interface MedicationFormData {
  name: string;
  description: string;
  category: string;
  manufacturer: string;
  price: string;
  stock_quantity: string;
  image_url: string;
  dosage_form: string;
  strength: string;
  prescription_required: boolean;
  active_ingredients: string;
  side_effects: string;
  warnings: string;
  is_available: boolean;
}

const initialFormData: MedicationFormData = {
  name: '',
  description: '',
  category: '',
  manufacturer: '',
  price: '',
  stock_quantity: '',
  image_url: '',
  dosage_form: '',
  strength: '',
  prescription_required: true,
  active_ingredients: '',
  side_effects: '',
  warnings: '',
  is_available: true,
};

const categories = [
  'Antibiotics',
  'Pain Relief',
  'Cardiovascular',
  'Diabetes',
  'Respiratory',
  'Gastrointestinal',
  'Allergy',
  'Vitamins & Supplements',
  'Dermatology',
  'Other',
];

const dosageForms = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Inhaler',
  'Cream',
  'Ointment',
  'Drops',
  'Spray',
  'Other',
];

export function MedicationManagement() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [formData, setFormData] = useState<MedicationFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMedications();
  }, []);

  useEffect(() => {
    filterMedications();
  }, [medications, searchTerm, selectedCategory]);

  const loadMedications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .order('name');

      if (error) throw error;
      setMedications(data || []);
    } catch (error) {
      console.error('Error loading medications:', error);
      alert('Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  const filterMedications = () => {
    let filtered = medications;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((m) => m.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.active_ingredients?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMedications(filtered);
  };

  const handleEdit = (medication: Medication) => {
    setEditingMed(medication);
    setFormData({
      name: medication.name,
      description: medication.description || '',
      category: medication.category || '',
      manufacturer: medication.manufacturer || '',
      price: medication.price.toString(),
      stock_quantity: medication.stock_quantity.toString(),
      image_url: medication.image_url || '',
      dosage_form: medication.dosage_form || '',
      strength: medication.strength || '',
      prescription_required: medication.prescription_required,
      active_ingredients: medication.active_ingredients || '',
      side_effects: medication.side_effects || '',
      warnings: medication.warnings || '',
      is_available: medication.is_available,
    });
    setShowForm(true);
  };

  const handleDelete = async (medication: Medication) => {
    if (!confirm(`Are you sure you want to delete ${medication.name}?`)) return;

    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', medication.id);

      if (error) throw error;

      alert('Medication deleted successfully');
      loadMedications();
    } catch (error) {
      console.error('Error deleting medication:', error);
      alert('Failed to delete medication');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const medicationData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        manufacturer: formData.manufacturer,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        image_url: formData.image_url || null,
        dosage_form: formData.dosage_form,
        strength: formData.strength,
        prescription_required: formData.prescription_required,
        active_ingredients: formData.active_ingredients || null,
        side_effects: formData.side_effects || null,
        warnings: formData.warnings || null,
        is_available: formData.is_available,
      };

      if (editingMed) {
        const { error } = await supabase
          .from('medications')
          .update(medicationData)
          .eq('id', editingMed.id);

        if (error) throw error;
        alert('Medication updated successfully');
      } else {
        const { error } = await supabase
          .from('medications')
          .insert([medicationData]);

        if (error) throw error;
        alert('Medication added successfully');
      }

      setShowForm(false);
      setEditingMed(null);
      setFormData(initialFormData);
      loadMedications();
    } catch (error) {
      console.error('Error saving medication:', error);
      alert('Failed to save medication');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingMed(null);
    setFormData(initialFormData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Medication Inventory</h2>
            <p className="text-gray-600 text-sm">Manage your medication stock</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Medication
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Package className="w-5 h-5" />
              <span className="text-sm font-medium">Total Items</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{medications.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">In Stock</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {medications.reduce((sum, m) => sum + m.stock_quantity, 0)} units
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Low Stock</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {medications.filter((m) => m.stock_quantity > 0 && m.stock_quantity < 10).length}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search medications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Showing {filteredMedications.length} of {medications.length} medications
        </p>
      </div>

      {/* Medications Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Medication
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMedications.map((med) => (
                <tr key={med.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{med.name}</div>
                      <div className="text-xs text-gray-500">
                        {med.strength} - {med.dosage_form}
                      </div>
                      <div className="text-xs text-gray-400">{med.manufacturer}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {med.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                      <DollarSign className="w-4 h-4" />
                      {med.price.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        med.stock_quantity === 0
                          ? 'bg-red-100 text-red-800'
                          : med.stock_quantity < 10
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {med.stock_quantity} units
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {med.is_available ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Available
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Unavailable
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => handleEdit(med)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(med)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingMed ? 'Edit Medication' : 'Add New Medication'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medication Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Manufacturer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufacturer *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dosage Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosage Form *
                  </label>
                  <select
                    required
                    value={formData.dosage_form}
                    onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Form</option>
                    {dosageForms.map((form) => (
                      <option key={form} value={form}>
                        {form}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Strength */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strength *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 500mg, 10ml"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Image URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formData.image_url && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-2">Image Preview:</p>
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Active Ingredients */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Active Ingredients
                  </label>
                  <textarea
                    rows={2}
                    value={formData.active_ingredients}
                    onChange={(e) => setFormData({ ...formData, active_ingredients: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Side Effects */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Side Effects
                  </label>
                  <textarea
                    rows={2}
                    value={formData.side_effects}
                    onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Warnings */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warnings
                  </label>
                  <textarea
                    rows={2}
                    value={formData.warnings}
                    onChange={(e) => setFormData({ ...formData, warnings: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Checkboxes */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.prescription_required}
                      onChange={(e) =>
                        setFormData({ ...formData, prescription_required: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Prescription Required</span>
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={(e) =>
                        setFormData({ ...formData, is_available: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Available for Sale</span>
                  </label>
                </div>
              </div>
            </div>

              {/* Form Actions */}
              <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingMed ? 'Update' : 'Add'} Medication
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
