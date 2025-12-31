import juiceJungleLogo from "@/assets/juice-jungle-logo.jpg";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <img 
          src={juiceJungleLogo} 
          alt="Juice Jungle Logo" 
          className="mx-auto mb-6 h-48 w-48 rounded-full object-cover shadow-lg"
        />
        <h1 className="mb-4 text-4xl font-bold text-primary">Juice Jungle</h1>
        <p className="text-xl text-muted-foreground">Sales Manager</p>
      </div>
    </div>
  );
};

export default Index;
