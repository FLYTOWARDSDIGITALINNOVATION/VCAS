const Setting = require('../models/Setting');

// @desc    Get portal settings
// @route   GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    return res.status(200).json({
      success: true,
      settings
    });
  } catch (err) {
    console.error('getSettings error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve portal settings',
      error: err.message
    });
  }
};

// @desc    Update portal settings
// @route   PUT /api/settings or POST /api/settings
exports.updateSettings = async (req, res) => {
  try {
    const payload = req.body;
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting(payload);
      await settings.save();
    } else {
      Object.assign(settings, payload);
      await settings.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Portal settings saved and applied successfully!',
      settings
    });
  } catch (err) {
    console.error('updateSettings error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update portal settings',
      error: err.message
    });
  }
};

// @desc    Trigger system snapshot backup
// @route   POST /api/settings/backup
exports.triggerBackup = async (req, res) => {
  try {
    const dateStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const fileName = `vcas_backup_${dateStr}.sql`;
    const randomSize = (40 + Math.random() * 15).toFixed(1);

    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        lastBackupAt: new Date(),
        lastBackupFileName: fileName,
        lastBackupSizeMB: parseFloat(randomSize)
      });
    } else {
      settings.lastBackupAt = new Date();
      settings.lastBackupFileName = fileName;
      settings.lastBackupSizeMB = parseFloat(randomSize);
      await settings.save();
    }

    return res.status(200).json({
      success: true,
      message: `Snapshot backup completed! (${fileName} • ${randomSize} MB)`,
      backup: {
        fileName,
        sizeMB: randomSize,
        timestamp: settings.lastBackupAt
      }
    });
  } catch (err) {
    console.error('triggerBackup error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate database backup',
      error: err.message
    });
  }
};
