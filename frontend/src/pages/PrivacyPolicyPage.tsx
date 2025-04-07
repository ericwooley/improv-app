import { Typography, Container, Box } from '@mui/material'

const PrivacyPolicyPage = () => {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom>
        Privacy Policy
      </Typography>

      <Box mt={4}>
        <Typography paragraph>
          This Privacy Policy ("Policy") applies to Improv HQ and Tengable LLC ("Company") and governs data collection
          and usage. By using our application, you consent to the data practices described here.
        </Typography>

        <Typography variant="h6" gutterBottom>
          Collection of Personal Information
        </Typography>
        <Typography paragraph>
          We don’t collect personal information unless you voluntarily provide it. You may need to provide personal info
          to use certain features, like registering, entering contests, making purchases, or contacting us.
        </Typography>

        <Typography variant="h6" gutterBottom>
          Sharing Information with Third Parties
        </Typography>
        <Typography paragraph>
          We don’t sell, rent, or lease customer data. We may share data with trusted partners for services like
          support, delivery, and communication. These partners must keep your info confidential.
        </Typography>
        <Typography paragraph>
          We may disclose personal info if required by law or to protect rights, safety, or property.
        </Typography>

        <Typography variant="h6" gutterBottom>
          Right to Deletion
        </Typography>
        <Typography paragraph>You may request that we delete your personal information. If valid, we will:</Typography>
        <ul>
          <li>Delete your info from our records</li>
          <li>Instruct service providers to do the same</li>
        </ul>
        <Typography paragraph>We may decline deletion if the info is needed to:</Typography>
        <ul>
          <li>Complete a transaction or provide a service</li>
          <li>Detect and prevent fraud or illegal activity</li>
          <li>Fix bugs or technical issues</li>
          <li>Protect free speech or legal rights</li>
          <li>Comply with the law</li>
          <li>Conduct research (with consent)</li>
          <li>Use internally within expected limits</li>
        </ul>

        <Typography variant="h6" gutterBottom>
          Children Under Thirteen
        </Typography>
        <Typography paragraph>
          We do not knowingly collect information from children under 13. They must have a guardian’s permission to use
          the app.
        </Typography>

        <Typography variant="h6" gutterBottom>
          Email Communications
        </Typography>
        <Typography paragraph>
          We may email you with offers, alerts, or updates. We may track email interactions to improve service.
        </Typography>
        <Typography paragraph>To stop marketing emails, click “unsubscribe” in any message.</Typography>

        <Typography variant="h6" gutterBottom>
          Changes to This Policy
        </Typography>
        <Typography paragraph>
          We may update this Policy for legal or service reasons. We’ll notify you via email, on the site, or through
          your account. Continued use means you accept the updated terms.
        </Typography>

        <Typography variant="h6" gutterBottom>
          Contact Information
        </Typography>
        <Typography paragraph>If you have questions or concerns about this Policy, contact us at:</Typography>
        <Typography paragraph>
          Tengable LLC
          <br />
          Email: [Contact Email]
          <br />
          Phone: [Phone Number]
        </Typography>
        <Typography variant="body2" mt={4}>
          Effective as of April 07, 2025
        </Typography>
      </Box>
    </Container>
  )
}

export default PrivacyPolicyPage
