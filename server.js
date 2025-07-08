app.get('/api/audit-logs', async (req, res) => {
  try {
    const { tournamentId, limit = 100 } = req.query;
    const filter = tournamentId ? { tournamentId } : {};
    const auditLogs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      parseInt(limit)
      .lean();
    res.json({ success: true, auditLogs });
  } catch (error) {
  }
});
