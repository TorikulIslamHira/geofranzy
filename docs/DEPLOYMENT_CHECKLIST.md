# GeoFrenzy Production Deployment Checklist

## Pre-Deployment (1-2 days before)

### Code Review
- [ ] All pull requests reviewed and approved
- [ ] No breaking changes in main branch
- [ ] Changelog updated
- [ ] Version number bumped
- [ ] All tests passing

### Security & Dependencies
- [ ] Run `npm audit` and resolve vulnerabilities
- [ ] Update security-critical packages
- [ ] Review all environment variables are set
- [ ] Check API keys are properly rotated
- [ ] Verify no secrets in code or git history

### Performance
- [ ] Run Lighthouse audits
- [ ] Bundle size within acceptable limits
- [ ] No console errors or warnings
- [ ] Load time < 3 seconds on 4G
- [ ] Core Web Vitals scores > 90

### Firebase Configuration
- [ ] Firestore security rules reviewed
- [ ] Database indexes optimized
- [ ] Backup enabled
- [ ] Monitoring alerts configured
- [ ] Rate limits and quotas set appropriately

### Mobile App (Expo)
- [ ] iOS build tested on physical device
- [ ] Android build tested on physical device
- [ ] App store screenshots updated
- [ ] Release notes prepared
- [ ] Privacy policy updated
- [ ] Terms of service updated

### Documentation
- [ ] API documentation updated
- [ ] User guide completed
- [ ] Troubleshooting guide prepared
- [ ] Support contact information updated

## Deployment Day

### Pre-Deployment Checks
- [ ] Team notified of deployment window
- [ ] On-call engineer assigned
- [ ] Monitoring dashboards prepared
- [ ] Alerting configured
- [ ] Rollback plan reviewed

### Web App Deployment
1. **Build & Test**
   - [ ] `npm run build` completes successfully
   - [ ] Tests pass: `npm test`
   - [ ] Verify build size and chunking

2. **Staging Deployment**
   ```bash
   ./scripts/deploy-web.sh staging
   ```
   - [ ] Deployment completes without errors
   - [ ] Staging site accessible
   - [ ] Smoke tests pass on staging
   - [ ] Run Lighthouse audit
   - [ ] Test core user flows

3. **Production Deployment**
   ```bash
   ./scripts/deploy-web.sh production
   ```
   - [ ] Production deployment starts
   - [ ] Monitor Firebase deployment logs
   - [ ] Production site loads
   - [ ] DNS/CDN cache invalidated
   - [ ] Monitor error rates (should be near 0%)

### Mobile App Deployment
1. **iOS Submission**
   ```bash
   eas build --platform ios --profile production
   ios-deploy-to-app-store
   ```
   - [ ] Build completes successfully
   - [ ] TestFlight build process
   - [ ] Internal team testing (24 hours)
   - [ ] Submit to App Review
   - [ ] Monitor review status

2. **Android Submission**
   ```bash
   eas build --platform android --profile production
   android-deploy-to-play-store
   ```
   - [ ] Build completes successfully
   - [ ] Internal testing (24 hours)
   - [ ] Submit to Play Store Review
   - [ ] Monitor review status

### Cloud Functions Deployment
```bash
firebase deploy --only functions --project geofrenzy-28807
```
- [ ] All 9 functions deploy successfully
- [ ] Check function execution logs
- [ ] Monitor error rates
- [ ] Verify scheduled functions running

### Firestore Deployment
```bash
firebase deploy --only firestore:rules,firestore:indexes --project geofrenzy-28807
```
- [ ] Rules deployed successfully
- [ ] Indexes building/built
- [ ] Monitor query performance
- [ ] Test permission enforcement

## Post-Deployment (1-2 hours after)

### Monitoring & Alerts
- [ ] All monitoring metrics green
- [ ] No critical errors in logs
- [ ] Error tracking (Sentry) shows normal levels
- [ ] Performance metrics normal
- [ ] Database queries performing well

### User Impact
- [ ] No spike in support tickets
- [ ] User feedback monitored
- [ ] Analytics showing normal traffic
- [ ] No known user-facing issues

### Verification Checks
```bash
# Run production smoke tests
npm run test:e2e:production

# Check critical user flows
- Login/signup working
- Map displays correctly
- Location updates working
- Friend system functional
- SOS system responsive

# Verify API responses
- Health check endpoint responding
- All Cloud Functions callable
- Firestore queries returning data
- Authentication working
```

### Rollback Decision
- [ ] No critical issues found → Proceed
- [ ] Critical issues found → Execute rollback

## Rollback Procedure (if needed)

1. **Web App Rollback**
   ```bash
   # Revert to previous deployment
   firebase hosting:channels:list
   firebase hosting:channels:deploy <previous-version>
   
   # Or deploy from previous release
   git checkout v<previous-version>
   ./scripts/deploy-web.sh production
   ```

2. **Cloud Functions Rollback**
   ```bash
   git checkout v<previous-version>
   firebase deploy --only functions --project geofrenzy-28807
   ```

3. **Database Rollback**
   - [ ] Restore from backup
   - [ ] Verify data integrity
   - [ ] Notify users if data loss

4. **Mobile Apps**
   - [ ] Cannot rollback after app store approval
   - [ ] Plan hotfix release
   - [ ] Communicate to users

## Post-Rollback (if executed)

- [ ] Root cause identified
- [ ] Issue fixed
- [ ] Fixes tested locally and on staging
- [ ] Re-plan deployment
- [ ] Post-mortem scheduled

## Post-Deployment (Next 24 hours)

### Monitoring
- [ ] Continue monitoring error rates
- [ ] Monitor performance metrics
- [ ] Check user analytics
- [ ] Review support tickets

### Updates
- [ ] [ ] Blog post about new features
- [ ] [ ] Update social media
- [ ] [ ] Notify beta testers
- [ ] [ ] Update status page

### Documentation
- [ ] [ ] Update deployment log
- [ ] [ ] Document any issues encountered
- [ ] [ ] Record deployment time
- [ ] [ ] Document any deviations from plan

## Approval Sign-offs

- **Product Manager**: _________________ Date: _______
- **Tech Lead**: _________________ Date: _______
- **DevOps**: _________________ Date: _______
- **QA Lead**: _________________ Date: _______

---

## Important Contacts

**On-Call Engineer**: [Contact Info]  
**Platform Team Lead**: [Contact Info]  
**Fire Chief**: [Contact Info]  
**Support Lead**: [Contact Info]

## Useful Commands

```bash
# Check Firebase project status
firebase projects:describe geofrenzy-28807

# Monitor Cloud Functions
firebase functions:describe
firebase functions:log

# Check Firestore performance
firebase firestore:stats

# View hosting deploy history
firebase hosting:releases:list

# Monitor errors and performance
# Visit: https://console.firebase.google.com/u/0/project/geofrenzy-28807

# Check App Store status
# iOS: https://appstoreconnect.apple.com
# Android: https://play.google.com/console
```

## Success Criteria

✅ **Deployment Successful When:**
- [x] No critical errors in logs
- [x] All metrics within normal ranges
- [x] All 9 Cloud Functions running
- [x] Firestore queries responsive
- [x] Zero increase in support tickets
- [x] User feedback positive
- [x] Mobile apps approved (within 24-48 hours)

---

**Last Updated**: 2026-02-22  
**Version**: 1.0  
**Maintained By**: GeoFrenzy DevOps Team
