
import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Truck, 
  AlertTriangle, 
  Plus, 
  Search, 
  Layers, 
  Box, 
  BarChart, 
  X, 
  CheckCircle2, 
  Trash2, 
  Edit, 
  ChevronRight,
  Filter,
  ShieldAlert
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  qty: number;
  unit: string;
  status: 'Optimal' | 'Low Stock' | 'Critical' | 'Maintenance';
}

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('bmi_data_inventory');
    return saved ? JSON.parse(saved) : [
      { id: 'AST-001', name: 'Dell Latitude Laptops', category: 'ICT', qty: 45, unit: 'pcs', status: 'Optimal' },
      { id: 'AST-002', name: 'A4 Printing Paper', category: 'Office', qty: 12, unit: 'reams', status: 'Low Stock' },
      { id: 'AST-003', name: 'Chemistry Beakers', category: 'Science Lab', qty: 120, unit: 'units', status: 'Optimal' },
      { id: 'AST-004', name: 'Standard Exam Desks', category: 'Furniture', qty: 450, unit: 'units', status: 'Optimal' },
    ];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'ICT',
    qty: '',
    unit: 'units',
    status: 'Optimal' as InventoryItem['status']
  });

  const categories = ['All', 'ICT', 'Science Lab', 'Furniture', 'Office', 'Theology Artifacts', 'General'];

  const saveToLocal = (newItems: InventoryItem[]) => {
    setItems(newItems);
    localStorage.setItem('bmi_data_inventory', JSON.stringify(newItems));
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, categoryFilter]);

  const stats = useMemo(() => ({
    totalAssets: items.length,
    lowStock: items.filter(i => i.status === 'Low Stock' || i.status === 'Critical').length,
    critical: items.filter(i => i.status === 'Critical').length,
    valuation: items.reduce((acc, curr) => acc + (curr.qty * 10), 0) // Mock valuation logic
  }), [items]);

  const handleOpenModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        qty: item.qty.toString(),
        unit: item.unit,
        status: item.status
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', category: 'ICT', qty: '', unit: 'units', status: 'Optimal' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      const updated = items.map(i => i.id === editingItem.id ? { 
        ...i, 
        name: formData.name, 
        category: formData.category, 
        qty: parseInt(formData.qty) || 0,
        unit: formData.unit,
        status: formData.status
      } : i);
      saveToLocal(updated);
    } else {
      const newItem: InventoryItem = {
        id: `AST-${Math.floor(Math.random() * 9000) + 1000}`,
        name: formData.name,
        category: formData.category,
        qty: parseInt(formData.qty) || 0,
        unit: formData.unit,
        status: formData.status
      };
      saveToLocal([newItem, ...items]);
    }
    setIsModalOpen(false);
  };

  const deleteItem = (id: string) => {
    if (window.confirm('Permanent Decommission: Are you sure you want to purge this asset from the institutional ledger?')) {
      saveToLocal(items.filter(i => i.id !== id));
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in relative">
      {/* Sticky Header */}
      <div className="flex-shrink-0 sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex flex-col md:flex-row justify-between items-center gap-2 shadow-sm min-h-[60px]">
        <div className="flex items-center gap-3 pl-14 w-full md:w-auto">
           <div className="w-1 h-5 bg-[#FFD700] rounded-none"></div>
           <div className="flex flex-col">
              <h2 className="text-base md:text-lg font-bold text-[#2E004F] dark:text-white tracking-tight uppercase leading-none">Asset & Inventory Control</h2>
              <p className="text-[8px] md:text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">BMI Institutional Property & Procurement Ledger</p>
           </div>
        </div>
        <div className="flex items-center gap-4 pl-14 md:pl-0 w-full md:w-auto justify-end">
           <button 
             onClick={() => handleOpenModal()}
             className="flex items-center gap-2 px-6 py-2 bg-[#4B0082] text-white rounded-none shadow-xl hover:bg-black transition-all font-black text-[9px] uppercase tracking-widest border border-[#FFD700]/30"
           >
            <Plus size={12} className="text-[#FFD700]" /> New Procurement Entry
          </button>
        </div>
      </div>

      {/* Sticky Top Tab Bar */}
      <div className="sticky top-[60px] z-30 bg-[#F8F9FA]/95 dark:bg-[#0a0015]/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar shadow-sm">
         <div className="flex items-center gap-2 mr-4 text-gray-400">
            <Layers size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Categories</span>
         </div>
         {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                categoryFilter === cat 
                  ? 'bg-[#4B0082] text-white shadow-lg shadow-purple-500/20 scale-105 border border-purple-500/50' 
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-[#4B0082]'
              }`}
            >
              {cat}
            </button>
         ))}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-none shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-purple-500">
             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fixed Asset Registry</h4>
             <div className="flex items-end justify-between">
                <p className="text-3xl font-black text-[#4B0082] dark:text-white">{stats.totalAssets.toLocaleString()}</p>
                <Layers size={24} className="text-purple-300 opacity-50" />
             </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-none shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-amber-500">
             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Supply Variance Alerts</h4>
             <div className="flex items-end justify-between">
                <p className="text-3xl font-black text-amber-500">{stats.lowStock}</p>
                <AlertTriangle size={24} className="text-amber-300 opacity-50" />
             </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-none shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-blue-500">
             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Procurement Latency</h4>
             <div className="flex items-end justify-between">
                <p className="text-3xl font-black text-blue-500">3 Nodes</p>
                <Truck size={24} className="text-blue-300 opacity-50" />
             </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-none shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-emerald-500">
             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimated Net Capital</h4>
             <div className="flex items-end justify-between">
                <p className="text-3xl font-black text-emerald-600">${(stats.valuation * 12).toLocaleString()}</p>
                <BarChart size={24} className="text-emerald-300 opacity-50" />
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 flex flex-col md:flex-row gap-4 items-center shadow-sm">
           <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Filter Inventory by Item Name, Category or Asset ID..." 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-none outline-none font-bold text-sm dark:text-white focus:ring-1 focus:ring-[#4B0082]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-none shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 bg-gray-900 text-white flex justify-between items-center border-b border-gray-800">
             <div className="flex items-center gap-3">
                <Package size={18} className="text-[#FFD700]" />
                <h3 className="font-black text-xs uppercase tracking-[0.25em]">Master Asset Ledger</h3>
             </div>
             <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Verified Node Audit Index</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                     <th className="px-6 py-5">Asset Ref</th>
                     <th className="px-6 py-5">Item Specification</th>
                     <th className="px-6 py-5">Institutional Category</th>
                     <th className="px-6 py-5 text-center">In-Stack Quantity</th>
                     <th className="px-6 py-5 text-center">Condition Status</th>
                     <th className="px-6 py-5 text-right">Commit Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-purple-50/20 dark:hover:bg-gray-700/20 transition-all group">
                       <td className="px-6 py-5 font-mono text-xs font-bold text-[#4B0082] dark:text-purple-300">{item.id}</td>
                       <td className="px-6 py-5 font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none text-sm">{item.name}</td>
                       <td className="px-6 py-5 text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">{item.category}</td>
                       <td className="px-6 py-5 text-center font-bold text-gray-700 dark:text-gray-300">{item.qty} <span className="text-[9px] text-gray-400 uppercase">{item.unit}</span></td>
                       <td className="px-6 py-5 text-center">
                          <span className={`px-3 py-1 rounded-none text-[9px] font-black uppercase tracking-widest border ${
                            item.status === 'Optimal' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            item.status === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                            'bg-red-50 text-red-700 border-red-200 animate-pulse'
                          }`}>
                            {item.status}
                          </span>
                       </td>
                       <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleOpenModal(item)} className="p-2 text-gray-400 hover:text-[#4B0082] transition-colors"><Edit size={16}/></button>
                             <button onClick={() => deleteItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                          </div>
                       </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr><td colSpan={6} className="py-24 text-center text-gray-400 font-black uppercase tracking-[0.4em] text-sm italic">Zero (0) Asset Records Identified in Query</td></tr>
                  )}
               </tbody>
            </table>
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1a0033]/90 backdrop-blur-3xl p-4">
             <div className="bg-white dark:bg-gray-900 shadow-2xl w-full max-w-lg border border-[#FFD700]/30 animate-slide-up overflow-hidden flex flex-col">
                <div className="bg-gray-900 p-8 border-b-2 border-[#FFD700] flex justify-between items-center text-white">
                   <div>
                      <h3 className="text-xl font-bold uppercase tracking-tight">{editingItem ? 'Update Asset Record' : 'Institutional Procurement Entry'}</h3>
                      <p className="text-[10px] font-bold text-[#FFD700] uppercase tracking-widest mt-1">BMI Asset Lifecycle Node</p>
                   </div>
                   <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-500 transition-all text-white"><X size={24}/></button>
                </div>

                <form onSubmit={handleSave} className="p-10 space-y-8 bg-[#FAFAFA] dark:bg-gray-950">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Item Formal Title</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. Server Rack Units / Laboratory Beakers"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-5 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none outline-none font-bold text-sm uppercase tracking-tight focus:border-[#4B0082]"
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Institutional Category</label>
                         <select 
                           value={formData.category}
                           onChange={e => setFormData({...formData, category: e.target.value})}
                           className="w-full px-5 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-xs font-black uppercase cursor-pointer outline-none focus:border-[#4B0082]"
                         >
                            {categories.slice(1).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Current Registry Status</label>
                         <select 
                           value={formData.status}
                           onChange={e => setFormData({...formData, status: e.target.value as any})}
                           className="w-full px-5 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-xs font-black uppercase cursor-pointer outline-none focus:border-[#4B0082]"
                         >
                            <option value="Optimal">Optimal Supply</option>
                            <option value="Low Stock">Supply Variance (Low)</option>
                            <option value="Critical">Critical Shortage</option>
                            <option value="Maintenance">Maintenance Lockdown</option>
                         </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Quantity Magnitude</label>
                         <input 
                           required
                           type="number" 
                           placeholder="0"
                           value={formData.qty}
                           onChange={e => setFormData({...formData, qty: e.target.value})}
                           className="w-full px-5 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none outline-none font-black text-xl text-[#4B0082] dark:text-[#FFD700]"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Metric Unit</label>
                         <select 
                           value={formData.unit}
                           onChange={e => setFormData({...formData, unit: e.target.value})}
                           className="w-full px-5 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-xs font-black uppercase cursor-pointer outline-none focus:border-[#4B0082]"
                         >
                            {['units', 'pcs', 'reams', 'liters', 'sets', 'kg'].map(unit => <option key={unit} value={unit}>{unit}</option>)}
                         </select>
                      </div>
                   </div>

                   <div className="flex flex-col gap-5 pt-4">
                      <button 
                        type="submit"
                        className="w-full py-5 bg-[#4B0082] text-white rounded-none shadow-2xl font-black uppercase tracking-[0.2em] text-xs border border-[#FFD700]/30 hover:bg-black transition-all flex items-center justify-center gap-4"
                      >
                        <CheckCircle2 size={18} className="text-[#FFD700]" /> {editingItem ? 'Authorize Record Commit' : 'Authorize Asset Registry'}
                      </button>
                      <button type="button" onClick={() => setIsModalOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors">Discard Protocol</button>
                   </div>
                </form>
             </div>
          </div>
        )}

        <div className="bg-gray-900 border-l-4 border-[#FFD700] p-6 text-white flex items-start gap-5 shadow-2xl">
           <div className="p-2 bg-[#FFD700] text-black shadow-lg"><ShieldAlert size={20}/></div>
           <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FFD700]">Institutional Asset Protocol</p>
              <p className="text-xs text-gray-300 mt-1">
                 Registry nodes are synchronized with the Global Procurement Database. All fixed assets require unique BMI identification tags for physical verification cycles.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
