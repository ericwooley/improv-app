import { Typography, Container, Box } from '@mui/material'

const TermsOfServicePage = () => {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom>
        Terms and Conditions
      </Typography>

      <Box mt={4}>
        <Typography variant="h6">Agreement between User and improvhq.moonpixels.app</Typography>
        <Typography paragraph>
          Welcome to https://improvhq.moonpixels.app. This website (the "Site") is operated by Tengable LLC
          ("Tengable"). Your use of the Site means you agree to all terms, conditions, and notices stated here (the
          "Terms"). Please read them carefully.
        </Typography>

        <Typography variant="h6">Overview</Typography>
        <Typography paragraph>
          improvhq.moonpixels.app is a social networking site that brings together improv groups to share games.
        </Typography>

        <Typography variant="h6">Privacy</Typography>
        <Typography paragraph>
          Your use of the site is subject to Tengable’s Privacy Policy. Please review it to understand how we collect
          and use your data.
        </Typography>

        <Typography variant="h6">Electronic Communications</Typography>
        <Typography paragraph>
          By visiting the Site or emailing Tengable, you consent to receive communications electronically. These satisfy
          any legal requirement for written communication.
        </Typography>

        <Typography variant="h6">Your Account</Typography>
        <Typography paragraph>
          You are responsible for your account security and all activities under it. Tengable may cancel or modify
          accounts at its discretion.
        </Typography>

        <Typography variant="h6">Children Under Thirteen</Typography>
        <Typography paragraph>
          Tengable does not knowingly collect data from anyone under 13. Users under 18 must have a guardian’s
          permission.
        </Typography>

        <Typography variant="h6">Third Party Links and Services</Typography>
        <Typography paragraph>
          The Site may link to other sites. Tengable is not responsible for third-party content or practices.
        </Typography>

        <Typography variant="h6">Prohibited Use and Intellectual Property</Typography>
        <Typography paragraph>
          You may not use the Site for unlawful or unauthorized purposes. All content belongs to Tengable or its
          licensors and is protected by law.
        </Typography>

        <Typography variant="h6">Communication Services</Typography>
        <Typography paragraph>
          You agree to use interactive services responsibly. Tengable may monitor or remove content at its discretion.
        </Typography>

        <Typography variant="h6">User Submissions</Typography>
        <Typography paragraph>
          Tengable does not claim ownership of your submissions but may use them in operations. You must have rights to
          any content you provide.
        </Typography>

        <Typography variant="h6">International Users</Typography>
        <Typography paragraph>
          Users outside the USA are responsible for complying with local laws. Tengable content may not be used where
          prohibited.
        </Typography>

        <Typography variant="h6">Indemnification</Typography>
        <Typography paragraph>
          You agree to hold Tengable harmless from claims or losses related to your Site use or content submissions.
        </Typography>

        <Typography variant="h6">Arbitration</Typography>
        <Typography paragraph>
          Disputes will be resolved by final and binding arbitration in accordance with the Federal Arbitration Act.
        </Typography>

        <Typography variant="h6">Class Action Waiver</Typography>
        <Typography paragraph>All disputes must be handled individually. Class actions are not allowed.</Typography>

        <Typography variant="h6">Liability Disclaimer</Typography>
        <Typography paragraph>
          The Site and all content are provided "as is" without warranties. Tengable is not liable for damages arising
          from Site use.
        </Typography>

        <Typography variant="h6">Termination</Typography>
        <Typography paragraph>
          Tengable may terminate your access at any time. The agreement is governed by Colorado law.
        </Typography>

        <Typography variant="h6">Entire Agreement</Typography>
        <Typography paragraph>
          These Terms are the entire agreement between you and Tengable. A printed version is valid in legal
          proceedings.
        </Typography>

        <Typography variant="h6">Changes</Typography>
        <Typography paragraph>
          Tengable may change these Terms at any time. Review them regularly for updates.
        </Typography>

        <Typography variant="h6">Contact</Typography>
        <Typography paragraph>
          Email: improvhq@moonpixels.app
          <br />
          Effective Date: April 07, 2025
        </Typography>
      </Box>
    </Container>
  )
}

export default TermsOfServicePage
