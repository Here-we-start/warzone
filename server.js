app.get('/api/audit-logs', async (req, res) => {
  try {
    const { tournamentId, limit = 100 } = req.query;
    const filter = tournamentId ? { tournamentId } : {};
    const auditLogs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string))
      .lean();
    res.json({ success: true, auditLogs });
  } catch (error) {
    logger.error('Get audit logs error', { error: error.message, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  } catch (error) {
  }
});
