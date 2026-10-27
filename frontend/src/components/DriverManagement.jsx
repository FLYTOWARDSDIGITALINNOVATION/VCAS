import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../apiConfig';
import {
  Bus,
  CalendarDays,
  Fuel,
  Gauge,
  IdCard,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UploadCloud,
  User,
  Users,
  X
} from 'lucide-react';

const blankDriverForm = {
  driverName: '',
  phoneNumber: '',
  address: '',
  aadharNumber: '',
  panNumber: '',
  aadharDocument: '',
  panDocument: '',
  drivingLicenseDocument: '',
  status: 'Active'
};

const blankDailyForm = {
  driverId: '',
  date: new Date().toISOString().split('T')[0],
  busNo: '',
  mileage: '',
  petrolCharge: '',
  remarks: ''
};

export default function DriverManagement() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [driverForm, setDriverForm] = useState(blankDriverForm);
  const [editingId, setEditingId] = useState('');
  const [dailyForm, setDailyForm] = useState(blankDailyForm);
  const [toast, setToast] = useState('');

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = setTimeout(() => setToast(''), 3000);
  };

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/drivers`);
      const json = await res.json();
      if (json.success) {
        setDrivers(Array.isArray(json.data) ? json.data : []);
      } else {
        setDrivers([]);
      }
    } catch (error) {
      console.error('Failed to load drivers:', error);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const filteredDrivers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return drivers;

    return drivers.filter((driver) => {
      const haystack = [
        driver.driverName,
        driver.phoneNumber,
        driver.address,
        driver.aadharNumber,
        driver.panNumber,
        driver.status,
        ...(Array.isArray(driver.dailyRecords) ? driver.dailyRecords.map((record) => `${record.busNo} ${record.driverName}`) : [])
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [drivers, search]);

  const handleDriverFileUpload = async (fieldName, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    const isAllowedExtension = /\.(jpg|jpeg|png|webp|pdf)$/i.test(file.name);
    if (!allowedTypes.includes(file.type) && !isAllowedExtension) {
      showToast('Please upload JPG, PNG, WEBP, or PDF files only.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Please upload a smaller file (max 5MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDriverForm((prev) => ({ ...prev, [fieldName]: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const renderDocumentPreview = (documentUrl, label) => {
    if (!documentUrl) {
      return <div className="mt-1 text-[10px] font-bold text-slate-400">Not uploaded</div>;
    }

    if (documentUrl.startsWith('data:image/')) {
      return (
        <img
          src={documentUrl}
          alt={label}
          className="mt-2 h-24 w-full rounded-xl border border-slate-200 object-contain bg-white"
        />
      );
    }

    return (
      <a
        href={documentUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex font-black text-indigo-700 underline"
      >
        View file
      </a>
    );
  };

  const handleDriverSubmit = async (e) => {
    e.preventDefault();

    if (!driverForm.driverName.trim()) {
      showToast('Driver name is required.');
      return;
    }

    try {
      const url = editingId ? `${API_BASE}/drivers/${editingId}` : `${API_BASE}/drivers`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...driverForm,
          driverName: driverForm.driverName.trim(),
          phoneNumber: driverForm.phoneNumber.trim(),
          address: driverForm.address.trim(),
          aadharNumber: driverForm.aadharNumber.trim(),
          panNumber: driverForm.panNumber.trim(),
          aadharDocument: driverForm.aadharDocument || '',
          panDocument: driverForm.panDocument || '',
          drivingLicenseDocument: driverForm.drivingLicenseDocument || ''
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Unable to save driver data.');
      }

      showToast(editingId ? 'Driver updated successfully.' : 'Driver added successfully.');
      setDriverForm(blankDriverForm);
      setEditingId('');
      fetchDrivers();
    } catch (error) {
      showToast(error.message || 'Failed to save driver.');
    }
  };

  const handleEdit = (driver) => {
    setEditingId(driver._id);
    setDriverForm({
      driverName: driver.driverName || '',
      phoneNumber: driver.phoneNumber || '',
      address: driver.address || '',
      aadharNumber: driver.aadharNumber || '',
      panNumber: driver.panNumber || '',
      aadharDocument: driver.aadharDocument || '',
      panDocument: driver.panDocument || '',
      drivingLicenseDocument: driver.drivingLicenseDocument || '',
      status: driver.status || 'Active'
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this driver record?')) return;
    try {
      const res = await fetch(`${API_BASE}/drivers/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Unable to delete driver.');
      }
      showToast('Driver deleted successfully.');
      fetchDrivers();
    } catch (error) {
      showToast(error.message || 'Failed to delete driver.');
    }
  };

  const handleDailySubmit = async (e) => {
    e.preventDefault();

    if (!dailyForm.driverId) {
      showToast('Please select a driver first.');
      return;
    }

    const selectedDriver = drivers.find((driver) => driver._id === dailyForm.driverId);
    if (!selectedDriver) {
      showToast('Driver not found.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/drivers/${dailyForm.driverId}/daily-record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dailyForm.date,
          driverName: selectedDriver.driverName,
          busNo: dailyForm.busNo.trim(),
          mileage: Number(dailyForm.mileage) || 0,
          petrolCharge: Number(dailyForm.petrolCharge) || 0,
          remarks: dailyForm.remarks.trim(),
          addedBy: 'Office Staff'
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Unable to save daily driver entry.');
      }

      showToast('Daily Bus Entry saved successfully.');
      setDailyForm({ ...blankDailyForm, driverId: dailyForm.driverId });
      fetchDrivers();
    } catch (error) {
      showToast(error.message || 'Failed to save daily record.');
    }
  };

  const totalPetrolSpend = useMemo(() => {
    return drivers.reduce((sum, driver) => {
      if (!Array.isArray(driver.dailyRecords)) return sum;
      return sum + driver.dailyRecords.reduce((driverSum, record) => driverSum + (Number(record.petrolCharge) || 0), 0);
    }, 0);
  }, [drivers]);

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-xl bg-slate-900 text-white text-xs font-bold px-4 py-2 shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-600">Transport Desk</p>
          <h1 className="text-2xl font-black text-slate-900">Driver Management</h1>
        </div>

        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-3 py-2 shadow-sm">
          <Fuel className="w-4 h-4 text-amber-500" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Petrol Spend</div>
            <div className="text-sm font-black text-slate-900">₹{Number(totalPetrolSpend).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.1fr,0.9fr] gap-6">
        <form onSubmit={handleDriverSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Driver Details</p>
              <h2 className="text-lg font-black text-slate-900">{editingId ? 'Update Driver' : 'Add New Driver'}</h2>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId('');
                  setDriverForm(blankDriverForm);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              <span>Driver Name</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <User className="w-4 h-4 text-slate-400" />
                <input
                  value={driverForm.driverName}
                  onChange={(e) => setDriverForm({ ...driverForm, driverName: e.target.value })}
                  className="w-full bg-transparent outline-none text-slate-900"
                  placeholder="Ex: Kumar"
                />
              </div>
            </label>

            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              <span>Phone Number</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <Phone className="w-4 h-4 text-slate-400" />
                <input
                  value={driverForm.phoneNumber}
                  onChange={(e) => setDriverForm({ ...driverForm, phoneNumber: e.target.value })}
                  className="w-full bg-transparent outline-none text-slate-900"
                  placeholder="98765 43210"
                />
              </div>
            </label>
          </div>

          <label className="block space-y-1.5 text-xs font-bold text-slate-700">
            <span>Address</span>
            <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
              <textarea
                value={driverForm.address}
                onChange={(e) => setDriverForm({ ...driverForm, address: e.target.value })}
                className="w-full min-h-[70px] bg-transparent outline-none resize-none text-slate-900"
                placeholder="Driver residential address"
              />
            </div>
          </label>

          <div className="grid md:grid-cols-2 gap-3">
            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              <span>Aadhar Number</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <IdCard className="w-4 h-4 text-slate-400" />
                <input
                  value={driverForm.aadharNumber}
                  onChange={(e) => setDriverForm({ ...driverForm, aadharNumber: e.target.value })}
                  className="w-full bg-transparent outline-none text-slate-900"
                  placeholder="XXXX-XXXX-XXXX"
                />
              </div>
            </label>

            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              <span>PAN Number</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <input
                  value={driverForm.panNumber}
                  onChange={(e) => setDriverForm({ ...driverForm, panNumber: e.target.value })}
                  className="w-full bg-transparent outline-none text-slate-900"
                  placeholder="ABCDE1234F"
                />
              </div>
            </label>
          </div>

          <div className="grid md:grid-cols-3 gap-3 items-end">
            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              <span>Aadhar Card</span>
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <UploadCloud className="w-4 h-4" />
                    <span className="text-[11px] font-bold">
                      {driverForm.aadharDocument ? 'Uploaded' : 'Upload'}
                    </span>
                  </div>
                  {driverForm.aadharDocument && (
                    <button
                      type="button"
                      onClick={() => setDriverForm({ ...driverForm, aadharDocument: '' })}
                      className="text-[10px] font-bold text-rose-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleDriverFileUpload('aadharDocument', e)}
                  className="mt-3 block w-full text-[11px] text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                />
              </div>
            </label>

            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              <span>PAN Card</span>
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <UploadCloud className="w-4 h-4" />
                    <span className="text-[11px] font-bold">
                      {driverForm.panDocument ? 'Uploaded' : 'Upload'}
                    </span>
                  </div>
                  {driverForm.panDocument && (
                    <button
                      type="button"
                      onClick={() => setDriverForm({ ...driverForm, panDocument: '' })}
                      className="text-[10px] font-bold text-rose-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleDriverFileUpload('panDocument', e)}
                  className="mt-3 block w-full text-[11px] text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                />
              </div>
            </label>

            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              <span>Driving License</span>
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <UploadCloud className="w-4 h-4" />
                    <span className="text-[11px] font-bold">
                      {driverForm.drivingLicenseDocument ? 'Uploaded' : 'Upload'}
                    </span>
                  </div>
                  {driverForm.drivingLicenseDocument && (
                    <button
                      type="button"
                      onClick={() => setDriverForm({ ...driverForm, drivingLicenseDocument: '' })}
                      className="text-[10px] font-bold text-rose-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleDriverFileUpload('drivingLicenseDocument', e)}
                  className="mt-3 block w-full text-[11px] text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                />
              </div>
            </label>
          </div>

          {(driverForm.aadharDocument || driverForm.panDocument || driverForm.drivingLicenseDocument) && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-[11px] font-bold text-emerald-800">
              Documents attached successfully. You can preview the actual uploaded images from the driver list after saving.
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-3 shadow-md"
          >
            <Plus className="w-4 h-4" />
            {editingId ? 'Update Driver' : 'Save Driver'}
          </button>
        </form>

        <form onSubmit={handleDailySubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Daily Record</p>
            <h2 className="text-lg font-black text-slate-900">Bus Mileage Log</h2>
          </div>

          <label className="block space-y-1.5 text-xs font-bold text-slate-700">
            <span>Driver Name</span>
            <select
              value={dailyForm.driverId}
              onChange={(e) => setDailyForm({ ...dailyForm, driverId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none"
            >
              <option value="">Select driver</option>
              {drivers.map((driver) => (
                <option key={driver._id} value={driver._id}>{driver.driverName}</option>
              ))}
            </select>
          </label>

          <div className="grid md:grid-cols-2 gap-3">
            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              <span>Date</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={dailyForm.date}
                  onChange={(e) => setDailyForm({ ...dailyForm, date: e.target.value })}
                  className="w-full bg-transparent outline-none text-slate-900"
                />
              </div>
            </label>

            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              <span>Bus Number</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <Bus className="w-4 h-4 text-slate-400" />
                <input
                  value={dailyForm.busNo}
                  onChange={(e) => setDailyForm({ ...dailyForm, busNo: e.target.value })}
                  className="w-full bg-transparent outline-none text-slate-900"
                  placeholder="TN 01 AB 1234"
                />
              </div>
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              <span>Mileage</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <Gauge className="w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  value={dailyForm.mileage}
                  onChange={(e) => setDailyForm({ ...dailyForm, mileage: e.target.value })}
                  className="w-full bg-transparent outline-none text-slate-900"
                  placeholder="0"
                />
              </div>
            </label>

            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              <span>Petrol Charge</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <Fuel className="w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  value={dailyForm.petrolCharge}
                  onChange={(e) => setDailyForm({ ...dailyForm, petrolCharge: e.target.value })}
                  className="w-full bg-transparent outline-none text-slate-900"
                  placeholder="0"
                />
              </div>
            </label>
          </div>

          <label className="block space-y-1.5 text-xs font-bold text-slate-700">
            <span>Remarks</span>
            <textarea
              value={dailyForm.remarks}
              onChange={(e) => setDailyForm({ ...dailyForm, remarks: e.target.value })}
              className="w-full min-h-[72px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none resize-none text-slate-900"
              placeholder="Trip note, route, or fuel details"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-3 shadow-md"
          >
            Save Daily Entry
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Driver Registry</p>
            <h2 className="text-lg font-black text-slate-900">Registered Drivers</h2>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search driver / bus / phone"
              className="w-full bg-transparent outline-none text-slate-900 text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs font-bold text-slate-500">Loading drivers...</div>
        ) : filteredDrivers.length === 0 ? (
          <div className="py-10 text-center text-xs font-bold text-slate-500">No driver records found.</div>
        ) : (
          <div className="space-y-4">
            {filteredDrivers.map((driver) => (
              <div key={driver._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-black text-slate-900">{driver.driverName}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${driver.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : driver.status === 'On Leave' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                          {driver.status || 'Active'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {driver.phoneNumber || '—'}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {driver.address || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(driver)}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-2 text-[10px] font-bold text-blue-700"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(driver._id)}
                      className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-2 text-[10px] font-bold text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid sm:grid-cols-3 gap-3 text-[11px] text-slate-700">
                  <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                    <div className="font-bold text-slate-500 uppercase tracking-wider">Aadhar</div>
                    <div className="mt-1 font-black text-slate-900">{driver.aadharNumber || '—'}</div>
                    {renderDocumentPreview(driver.aadharDocument, 'Aadhar Card')}
                  </div>
                  <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                    <div className="font-bold text-slate-500 uppercase tracking-wider">PAN</div>
                    <div className="mt-1 font-black text-slate-900">{driver.panNumber || '—'}</div>
                    {renderDocumentPreview(driver.panDocument, 'PAN Card')}
                  </div>
                  <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                    <div className="font-bold text-slate-500 uppercase tracking-wider">Driving License</div>
                    {renderDocumentPreview(driver.drivingLicenseDocument, 'Driving License')}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2">Daily Bus Entries</div>
                  {Array.isArray(driver.dailyRecords) && driver.dailyRecords.length > 0 ? (
                    <div className="space-y-2">
                      {driver.dailyRecords.slice(0, 5).map((record, idx) => (
                        <div key={`${driver._id}-${idx}`} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2 font-black text-slate-900 text-xs">
                              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                              {record.date ? new Date(record.date).toLocaleDateString('en-IN') : '—'}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 flex-wrap">
                              <span className="flex items-center gap-1"><Bus className="w-3 h-3" /> {record.busNo || '—'}</span>
                              <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> {record.mileage || 0} km</span>
                              <span className="flex items-center gap-1"><Fuel className="w-3 h-3" /> ₹{Number(record.petrolCharge || 0).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-[10px] text-slate-500">
                            Driver: <span className="font-bold text-slate-700">{record.driverName || driver.driverName}</span>
                            {record.remarks ? ` • ${record.remarks}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-[11px] font-bold text-slate-500">
                      No daily logs for this driver yet.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
